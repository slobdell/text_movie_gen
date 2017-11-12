var INACTIVE = 0;
var ACTIVE = 1;

function loadSprite(src, callback) {
    var sprite = new Image();
    sprite.onload = callback;
    sprite.src = src;
    return sprite;
}


ThrottleView = Backbone.View.extend({
    events: {
        "touchstart": "startControl",
        "touchmove": "move",
        "touchend": "endCotrol",
        "mousedown": "startControl",
        "mouseup": "endControl",
        "mousemove": "move"
    },
    initialize: function(squareSize, triggerDistancePercent, finishedLoadCallback){
        this.squareSize = squareSize;
        this.template = _.template($("#throttle-view").html());
        this.state = INACTIVE;
        this.x = 0;
        this.y = 0;
        this.canvas = null;
        this.context = null;
        this.radius = (this.squareSize / 2) * 0.5;
        this.triggerDistancePercent = triggerDistancePercent;
        this._lastTriggeredX = 0;
        this._lastTriggeredY = 0;

        this.finishedLoadCallback = finishedLoadCallback;

        this.throttleLoaded = false;
        this.backgroundLoaded = false;
        this.lastTouch = new Date().getTime();
        var self = this;
        this.sprite = loadSprite("/static/assets/button.png", function(){
            self.throttleLoaded = true;
            self._tryCallback();
        });
        this.background = loadSprite("/static/assets/throttle.png", function(){
            self.backgroundLoaded = true;
            self._tryCallback();
        });
    },
    _tryCallback: function(){
      if(this.backgroundLoaded && this.throttleLoaded){
          var self = this;
          this.finishedLoadCallback(self);
      }
      this.render();
    },
    startControl: function(evt){
        this.state = ACTIVE;
    },
    endControl: function(evt){
        this.state = INACTIVE;
        this.renderSprite();
    },
    move: function(evt){
        if(this.state == INACTIVE){
            return;
        }
        this.lastTouch = new Date().getTime();

        var x, y;


        if(evt.originalEvent && evt.originalEvent.touches){
            evt.preventDefault();
            var left = 0;
            var fromTop = 0;
            elem = $(this.canvas)[0];
            while(elem) {
                left = left + parseInt(elem.offsetLeft);
                fromTop = fromTop + parseInt(elem.offsetTop);
                elem = elem.offsetParent;
            }
            x = evt.originalEvent.touches[0].clientX - left;
            y = evt.originalEvent.touches[0].clientY - fromTop;
        } else {
            x = evt.offsetX;
            y = evt.offsetY;
        }
        this._mutateToCartesian(x, y);
        this._maybeTriggerChange();
    },
    _getYPercent: function() {
      var yPercent = this.y / this.radius;
      if(Math.abs(yPercent) > 1.0){
          yPercent /= Math.abs(yPercent);
      }
      return yPercent;
    },
    _maybeTriggerChange: function(){
        var xPercent = this.x / this.radius;

        var yPercent = this._getYPercent();

        if(Math.abs(xPercent) > 1.0){
            xPercent /= Math.abs(xPercent);
        }
        if (this._distanceExceedsThreshold(xPercent, yPercent)) {
          this.trigger("verticalMove", yPercent);
        }
    },
    getAltitudePercent: function() {
      var interprettedPercent = ((this._getYPercent() + 1.0) / 2.0);

      var maxLog = Math.log(100);

      var multiplier = Math.log(
        Math.max(
          interprettedPercent * 100.0,
          1.0
        )
      ) / maxLog;
      interprettedPercent *= multiplier;
      return interprettedPercent;
    },
    _distanceExceedsThreshold: function(xPercent, yPercent) {
      var distanceSquared = (
        Math.pow(xPercent - this._lastTriggeredX, 2) +
        Math.pow(yPercent - this._lastTriggeredY, 2)
      );
      if (distanceSquared > Math.pow(this.triggerDistancePercent, 2)) {
        this._lastTriggeredX = xPercent;
        this._lastTriggeredY = yPercent;
        return true;
      }
      return false;
    },
    _mutateToCartesian: function(x, y){
        x -= (this.squareSize) / 2;
        y *= -1;
        y += (this.squareSize) / 2;
        if(isNaN(y)){
            y = this.squareSize / 2;
        } else if(y > this.radius) {
          y = this.radius;
        } else if (y < -this.radius) {
          y = -this.radius;
        }

        this.x = 0;
        this.y = y;
        this.renderSprite();
    },
    _cartesianToCanvas: function(x, y){
        var newX = x + this.squareSize / 2;
        var newY = y - (this.squareSize / 2);
        newY = newY * -1;
        return {
            x: newX,
            y: newY
        }
    },
    renderSprite: function(){
        var originalWidth = 89;
        var originalHeight = 89;

        var spriteWidth = 50;
        var spriteHeight = 50;
        var pixelsLeft = 0; //ofset for sprite on img
        var pixelsTop = 0; //offset for sprite on img
        var coords = this._cartesianToCanvas(this.x, this.y);
        if(this.context == null){
            return;
        }
        // hack dunno why I need the 2x
        this.context.clearRect(0, 0, this.squareSize * 2, this.squareSize);

        var backImageSize = 300;
        this.context.drawImage(this.background,
            0,
            0,
            backImageSize,
            backImageSize,
            0,
            0,
            this.squareSize,
            this.squareSize
        )
        this.context.drawImage(this.sprite,
            pixelsLeft,
            pixelsTop,
            originalWidth,
            originalHeight,
            coords.x - spriteWidth / 2,
            coords.y - spriteHeight / 2,
            spriteWidth,
            spriteHeight
        );
    },
    render: function(){
        var renderData = {
            squareSize: this.squareSize
        };
        this.$el.html(this.template(renderData));
        this.canvas = this.$('#throttleCanvas')[0];
        this.context = this.canvas.getContext('2d');
        this.renderSprite();
        this.delegateEvents();
        return this;
    }
});
