var AggregateView = Backbone.View.extend({
  events: {
    "click .btn": "submit"
  },
  initialize: function() {
    this.setElement("#container");
    this.delegateEvents();
  },
  submit: function() {
    var scrollType = $("input[name='scrollStyle']:checked").val();
    var scrollSeconds = $("#scroll-seconds").val();
    var fontColor = $("#font-color").val();
    var backColor = $("#back-color").val();
    var fontSize = $("#font-size").val();
    var text = $("#text-val").val();
    $.post({
      url: "/api/create_video/",
      contentType: 'application/json',
      data: JSON.stringify({
        font_size: fontSize,
        scroll_type: scrollType,
        scroll_seconds: scrollSeconds,
        font_color: fontColor,
        back_color: backColor,
        text: text
      }),
      dataType: 'json',
      success: function(msg) {
        $("#video-src").attr("src", "data:video/mp4;base64," + msg.video);
        $("video")[0].load()
        $("#success-message").html("New video created at " + new Date().getTime());
      },
      error: function(XMLHttpRequest, textStatus, errorThrown)  {
        $("#success-message").html("ERROR")
      }
    });
  },
  render: function() {
  }
});

