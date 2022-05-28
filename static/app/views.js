var AggregateView = Backbone.View.extend({
  events: {
    "click .update-text": "submit",
    "click .preview-text": "preview"
  },
  initialize: function() {
    this.setElement("#container");
    this.delegateEvents();
  },
  preview: function() {
    data = this.postData();
    $.post({
      url: "/api/preview/",
      contentType: 'application/json',
      data: JSON.stringify(data),
      dataType: 'json',
      success: function(msg) {
        $("#video-src").attr("src", "data:video/mp4;base64," + msg.video);
        $("video")[0].load()
        $("#success-message").html("Preview only");
	$(".alert-success").show();
      },
      error: function(XMLHttpRequest, textStatus, errorThrown)  {
        $("#success-message").html("ERROR")
      }
    });
  },
  postData: function() {
    var scrollType = $("input[name='scrollStyle']:checked").val();
    var scrollSeconds = $("#scroll-seconds").val();
    var fontColor = $("#font-color").val();
    var backColor = $("#back-color").val();
    var fontSize = $("#font-size").val();
    var text = $("#text-val").val();
    return {
        font_size: fontSize,
        scroll_type: scrollType,
        scroll_seconds: scrollSeconds,
        font_color: fontColor,
        back_color: backColor,
        text: text
    };
  },
  submit: function() {
    data = this.postData();
    $.post({
      url: "/api/create_video/",
      contentType: 'application/json',
      data: JSON.stringify(data),
      dataType: 'json',
      success: function(msg) {
        $("#video-src").attr("src", "data:video/mp4;base64," + msg.video);
        $("video")[0].load()
        $("#success-message").html("New video created at " + new Date().getTime());
	$(".alert-success").show();
      },
      error: function(XMLHttpRequest, textStatus, errorThrown)  {
        $("#success-message").html("ERROR")
      }
    });
  },
  render: function() {
  }
});

