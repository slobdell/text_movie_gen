
var FlightPointSelector = Backbone.View.extend({
  initialize: function(selectedPoint, globalFlownPointSelection, flownPoints) {
    this._cache = {};
    this.flownPoints = flownPoints;
    this.selectedPoint = selectedPoint;
    this.globalFlownPointSelection = globalFlownPointSelection
    this.listenTo(
      this.selectedPoint,
      EVENTS.UPDATE_SELECTION_POINT,
      this.updateFlightPointFromSelection
    );
    this.updateFlightPointFromSelection();
  },
  updateFlightPointFromSelection: function() {
    this.globalFlownPointSelection.set(
      "selection",
      this.findBestFlightPointsCached(FLOWN_POINT_SIZE)
    )
    this.globalFlownPointSelection.trigger(
      EVENTS.UPDATE_FLIGHT_POINT
    );
  },
  findBestFlightPointsCached: function(n) {
    //return this.findBestFlightPoints(n);
    var key = "";
    var keyComponents = [
      "latitude",
      "longitude",
      "altitude",
    ];
    for(var i=0; i<keyComponents.length; i++) {
      key += this.selectedPoint.get(keyComponents[i]);
    }

    if(typeof this._cache[key] === "undefined") {
      var result = this.findBestFlightPoints(n);
      this._cache[key] = result;
    }
    return this._cache[key];
  },
  findBestFlightPoints: function(n) {
    var possiblePoints = this._filteredFlownByAzimuth();
    var minDistance = 100000.0;

    for(var i=0; i < possiblePoints.length; i++) {
      possiblePoints[i].set(
        "tempWeight",
        (
          possiblePoints[i].getDistanceTo(this.selectedPoint) +
          possiblePoints[i].getExtraWeight(this.selectedPoint)
        )
      );
    }
    possiblePoints.sort(
      function(a, b) {
        return a.get("tempWeight") - b.get("tempWeight");
      }
    );

    var visitedTimestamps = {};
    var filteredByTimestamp = [];
    cursor = 0;
    while(filteredByTimestamp.length < n) {
      if (cursor >= possiblePoints.length) {
        break;
      }
      var timestamp = parseInt(possiblePoints[cursor].get("time_utc_usec") / (1000.0 * 1000.0));
      if (typeof visitedTimestamps[timestamp] === "undefined") {
        filteredByTimestamp.push(possiblePoints[cursor]);
        for (var offset = -DEBOUNCE_SECONDS; offset <= DEBOUNCE_SECONDS; offset++) {
          visitedTimestamps[timestamp + offset] = true;
        }
      } else {
      }
      visitedTimestamps[timestamp] = true;
      cursor++;
    }
    return filteredByTimestamp;
  },
  _filteredFlownByAzimuth() {
    // TODO this isn't ready yet because I need to apply a camera offset
    return this.flownPoints;
  }
});
