import base64
import json
import commands
from multiprocessing import Pool
import os
import re

from flask import Flask
from flask import request
from flask import send_from_directory

app = Flask(__name__)

OUTPUT_NAME = "output"
# this is independently configured inside the LED controller; This is somewhat hacky.
FRAME_RATE = 30


class Context(object):
    video_number = 0
    keyspace_version = 1


def enqueued_fname(keyspace, vid_num):
    return "keyspace_%03d_video_%03d.avi" % (keyspace, vid_num)


def run_command(command):
    # start = time.time()
    ret_code, output = commands.getstatusoutput(command)
    # end = time.time()
    # print "Finished in %s seconds" % (end - start)
    return ret_code, output

# one process each for mp4 / avi
pool = Pool(2)


class VideoInput(object):

    def __init__(self, request_json):
        self._request_json = request_json

    @property
    def font_size(self):
        return self._request_json["font_size"]

    @property
    def back_color(self):
        return self._request_json["back_color"]

    @property
    def font_color(self):
        return self._request_json["font_color"]

    @property
    def scroll_seconds(self):
        return int(self._request_json["scroll_seconds"])

    @property
    def scroll_type(self):
        return self._request_json["scroll_type"]

    @property
    def text(self):
        return _cleaned_text(
            self._request_json["text"]
        )


with open("index.html", "rb") as f:
    HOME = f.read()


with open("settings.json", "rb") as f:
    SETTINGS = json.loads(f.read())


@app.route('/')
def index():
    return HOME


@app.route('/static/<path:path>')
def send_static(path):
    return send_from_directory('static', path)


@app.route('/api/preview/', methods=['POST'])
def preview():
    video_input = VideoInput(request.json)
    run_command(
        _video_input_to_command(video_input, "mp4"),
    )
    return json.dumps({"video": _get_video_as_b64()}), 200


@app.route('/api/create_video/', methods=['POST'])
def receive_user_input():
    video_input = VideoInput(request.json)
    pool.map(
            run_command,
            [
                _video_input_to_command(video_input, "mp4"),
                _video_input_to_command(video_input, "avi"),
            ],
    )
    Context.video_number += 1
    avi_out = os.path.join(SETTINGS["video_output"], "%s.%s" % (OUTPUT_NAME, "avi"))
    mved = os.path.join(SETTINGS["video_output"], enqueued_fname(Context.keyspace_version, Context.video_number)) 
    run_command("mv %s %s" % (avi_out, mved))
    # run_command("cp %s %s" % (mved, "last_created.avi"))
    """
    This used to be necessary when running on the same machine.
    try:
        os.system("killall ffmpeg")
    except:
       pass
    """
    return json.dumps({"video": _get_video_as_b64()}), 200


def _get_video_as_b64():
    with open("%s%s" % (SETTINGS["video_output"], OUTPUT_NAME + ".mp4"), "rb") as f:
        return base64.b64encode(f.read())


def _video_input_to_command(video_input, extension):
    if video_input.scroll_type == "static":
        scroll_pos = "x=(w-text_w)/2:y=(h-text_h)/2"
    elif video_input.scroll_type == "vertical":
        scroll_pos = "y=h-mod(max(t-{scroll_start_seconds}\,0)*(h+th)/{scroll_time_seconds}\,(h+th)):x=(w-text_w)/2".format(
            scroll_start_seconds=SETTINGS["scroll_buffer_seconds"],
            scroll_time_seconds=video_input.scroll_seconds,
        )
    elif video_input.scroll_type == "horizontal":
        scroll_pos = "x=w-mod(max(t-{scroll_start_seconds}\,0)*(w+tw)/{scroll_time_seconds}\,(w+tw)):y=(h-text_h)/2".format(
            scroll_start_seconds=SETTINGS["scroll_buffer_seconds"],
            scroll_time_seconds=video_input.scroll_seconds,
        )

    out_path = os.path.join(SETTINGS["video_output"], "%s.%s" % (OUTPUT_NAME, extension))
    # mp4
    base_cmd = "ffmpeg -y -f lavfi -i color=s={width}x{height}:d={video_seconds}:c={back_color} -c:v libx264 -crf 10  -vf drawtext=\"fontfile={font}: text='{text}': fontcolor={font_color}: fontsize={font_size}: {scroll_pos}: ft_load_flags=force_autohint\" -r {frame_rate} {output_path}"
    if extension == "avi":
        base_cmd = "ffmpeg -y -f lavfi -i color=s={width}x{height}:d={video_seconds}:c={back_color} -c:v libx264 -crf 10 -vf drawtext=\"fontfile={font}: text='{text}': fontcolor={font_color}: fontsize={font_size}: {scroll_pos}: ft_load_flags=force_autohint\" -r {frame_rate} {output_path}"
    ret = base_cmd.format(
        output_path=out_path,
        width=SETTINGS["width"],
        height=SETTINGS["height"],
        video_seconds=video_input.scroll_seconds + SETTINGS["scroll_buffer_seconds"],
        back_color=video_input.back_color,
        font=SETTINGS["font"],
        text=video_input.text.replace(":", "\:"),
        font_color=video_input.font_color,
        font_size=video_input.font_size,
        scroll_pos=scroll_pos,
        frame_rate=FRAME_RATE,
    )
    return ret


def _cleaned_text(text):
    return text
    # return re.sub(r'([^\s\w]|_)+', '', text).replace(" ", "\ ")
