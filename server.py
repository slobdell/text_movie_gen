import base64
import json
import commands
import os
import re

from flask import Flask
from flask import request
from flask import send_from_directory

app = Flask(__name__)

OUTPUT_FILENAME = "output.mp4"


def run_command(command):
    # start = time.time()
    ret_code, output = commands.getstatusoutput(command)
    # end = time.time()
    # print "Finished in %s seconds" % (end - start)
    return ret_code, output


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


@app.route('/api/create_video/', methods=['POST'])
def receive_user_input():
    video_input = VideoInput(request.json)
    run_command(
        _video_input_to_command(video_input)
    )
    try:
        os.system("killall ffmpeg")
    except:
        pass
    return json.dumps({"video": _get_video_as_b64()}), 200


def _get_video_as_b64():
    with open("%s%s" % (SETTINGS["video_output"], OUTPUT_FILENAME), "rb") as f:
        return base64.b64encode(f.read())


def _video_input_to_command(video_input):
    if video_input.scroll_type == "static":
        scroll_pos = "x=(w-text_w)/2:y=(h-text_h)/2"
    elif video_input.scroll_type == "vertical":
        scroll_pos = "y=h-mod(max(t-{scroll_start_seconds}\,0)*(h+th)/{scroll_time_seconds}\,(h+th)):x=(w-text_w)/2".format(
            scroll_start_seconds=0,
            scroll_time_seconds=video_input.scroll_seconds,
        )
    elif video_input.scroll_type == "horizontal":
        scroll_pos = "x=w-mod(max(t-{scroll_start_seconds}\,0)*(w+tw)/{scroll_time_seconds}\,(w+tw)):y=(h-text_h)/2".format(
            scroll_start_seconds=0,
            scroll_time_seconds=video_input.scroll_seconds,
        )

    return "ffmpeg -y -f lavfi -i color=s={width}x{height}:d={video_seconds}:c={back_color} -vf drawtext=\"fontfile={font}: text='{text}': fontcolor={font_color}: fontsize={font_size}: {scroll_pos}: ft_load_flags=force_autohint\" {output_dir}output.mp4".format(
        output_dir=SETTINGS["video_output"],
        width=SETTINGS["width"],
        height=SETTINGS["height"],
        video_seconds=video_input.scroll_seconds + SETTINGS["scroll_buffer_seconds"],
        back_color=video_input.back_color,
        font=SETTINGS["font"],
        text=video_input.text,
        font_color=video_input.font_color,
        font_size=video_input.font_size,
        scroll_pos=scroll_pos,
    )


def _cleaned_text(text):
    return text
    # return re.sub(r'([^\s\w]|_)+', '', text).replace(" ", "\ ")
