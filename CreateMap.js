//  function to call the json object
// function getJSON() {

// 		var result = null;

// 		$.ajax({

// 				async: false,

//                 // Our sample url to make request
//                 url:
//                     'http://localhost:8080/MapData',

//                 // Type of Request
//                 type: "GET",

//                 // Function to call when to
//                 // request is ok
//                 success: function (data) {
//                     result = data;
//                     //console.log(result);

// 				}
// 		});
// 		return result;

// }

// storing the json
// var jsonData = getJSON();
// console.log(jsonData);

// // function to get the state geoJSON
// function getStateGeoJSON() {

// 		var result = null;

// 		$.ajax({

// 				async: false,

//                 // Our sample url to make request
//                 url:
//                     'http://localhost:8080/shapefile/State',

//                 // Type of Request
//                 type: "GET",

//                 // Function to call when to
//                 // request is ok
//                 success: function (data) {
//                     result = data;
//                     //console.log(result);

// 				}
// 		});
// 		return result;

// }

// // storing the state geoJSON

// var state =  getStateGeoJSON();
// console.log(state);

// function to create the map
function CreateMap(map) {
  // Initialize the map object
  var map = L.map("map", {
    center: [23.5, 78.29], // Center coordinates for India
    zoom: 5, // Initial zoom level
  });

  // Process jsonData to ensure numeric types for values
  const jsonDataLength = jsonData.length;
  for (let i = 0; i < jsonDataLength; i++) {
    jsonData[i].value = parseFloat(jsonData[i].State_wise_sanctioned_projects);
    jsonData[i].projectSubmitValue = parseFloat(jsonData[i].ProjectSubmitCount);
    jsonData[i].state_code = parseInt(jsonData[i].num_lgd_state_code);
  }

  // Process state data to match structure with jsonData
  const stateFeaturesLength = state.features.length;
  for (let i = 0; i < stateFeaturesLength; i++) {
    state.features[i].State_LGD = parseInt(state.features[i].State_LGD);
  }

  // Initial variable to display on the map
  let currentVariable = "count";

  /**
   * Update feature values based on the selected variable
   * @param {string} variable - The variable to update values for (e.g., "count" or "ProjectSubmitCount")
   */
  function updateFeatureValues(variable) {
    const variableMapping = {
      count: "count",
      ProjectSubmitCount: "number_of_proposal_submitted",
    };

    const mappedVariable = variableMapping[variable];

    for (let i = 0; i < stateFeaturesLength; i++) {
      const stateCode = state.features[i].properties.State_LGD;
      const match = jsonData.find((data) => data.state_code === stateCode);

      state.features[i].properties.value = match
        ? match[mappedVariable] || 0
        : 0;
    }
  }

  // Set initial feature values for the default variable
  updateFeatureValues(currentVariable);

  // Add state GeoJSON layer
  const StateLayer = L.geoJSON(state, {
    style: style, // Define state style
    onEachFeature: (feature, layer) => {
      // Define interactivity for each state
      layer.on({
        mouseover: (e) => highlightFeature(e, feature), // Highlight on hover
        mouseout: (e) => resetHighlight(e), // Reset highlight on mouse out
        click: (e) => showCount(e, feature), // Show info on click
      });
    },
  }).addTo(map);

  // Dropdown control for variable selection
  const DropdownControl = L.Control.extend({
    onAdd: function () {
      const container = L.DomUtil.create(
        "div",
        "dropdown-container leaflet-bar"
      );

      container.innerHTML = `
        <label for="variableSelector">Select Variable:</label>
        <select id="variableSelector">
          <option value="count">State_wise_sanctioned_projects</option>
          <option value="ProjectSubmitCount">Project Submit Count</option>
        </select>
      `;

      // Prevent clicks on dropdown from propagating to the map
      L.DomEvent.disableClickPropagation(container);

      return container;
    },
  });

  // Add dropdown to the map
  map.addControl(new DropdownControl({ position: "topright" }));

  // Add a dropdown control for filtering based on thresholds
  const FilterControl = L.Control.extend({
    onAdd: function () {
      const container = L.DomUtil.create("div", "filter-container leaflet-bar");

      container.innerHTML = `
        <label for="filterSelector">Filter:</label>
        <select id="filterSelector">
          <option value="none">No Filter</option>
          <option value="50">&gt; 50</option>
          <option value="100">&gt; 100</option>
          <option value="150">&gt; 150</option>
          <option value="200">&gt; 200</option>
          <option value="500">&gt; 500</option>
          <option value="1000">&gt; 1000</option>
        </select>
      `;
      L.DomEvent.disableClickPropagation(container);

      return container;
    },
  });

  // Add the filter dropdown to the map
  map.addControl(new FilterControl({ position: "topright" }));

  // Update state values on dropdown change
  document
    .getElementById("variableSelector")
    .addEventListener("change", (e) => {
      currentVariable = e.target.value; // Get selected variable
      updateFeatureValues(currentVariable); // Update feature values

      StateLayer.clearLayers(); // Clear old layers
      StateLayer.addData(state); // Add updated data

      // Reset the filter dropdown to "No Filter"
      document.getElementById("filterSelector").value = "none";
    });

  // Update state highlighting based on the filter selection
  document.getElementById("filterSelector").addEventListener("change", (e) => {
    const selectedThreshold = parseInt(e.target.value);

    StateLayer.eachLayer((layer) => {
      const stateValue = layer.feature.properties.value;

      if (!isNaN(selectedThreshold) && stateValue > selectedThreshold) {
        // Highlight states meeting the threshold
        layer.setStyle({
          color: "red",
          fillColor: "red",
          fillOpacity: 0.7,
        });
      } else {
        // Reset style for states not meeting the threshold
        layer.setStyle(style(layer.feature));
      }
    });
  });

  // Add permanent labels for each state
  for (let i = 0; i < stateFeaturesLength; i++) {
    const latlng = [
      state.features[i].properties.Latitude,
      state.features[i].properties.Longitude,
    ];
    const LabelContent = String(state.features[i].properties.STATE);

    L.tooltip({
      permanent: true,
      direction: "center",
      className: "my-labels",
    })
      .setLatLng(latlng)
      .setContent(LabelContent)
      .addTo(map);
  }

  // Add point markers for each state
  for (let i = 0; i < stateFeaturesLength; i++) {
    const latlng = [
      state.features[i].properties.Latitude,
      state.features[i].properties.Longitude,
    ];
    const circle = L.circleMarker(latlng, {
      color: "red",
      fillColor: "#f03",
      fillOpacity: 0.5,
      radius: 3,
    }).addTo(map);

    circle.bindPopup(`State: <b>${state.features[i].properties.STATE}</b><br>
                      Count: <b>${state.features[i].properties.value}</b>`);
  }

  // Add a legend to the map
  const legend = L.control({ position: "bottomright" });
  legend.onAdd = function () {
    const div = L.DomUtil.create("div", "info legend");
    const grades = [0, 50, 100, 200, 400, 500, 600, 800, 1000];
    const labels = [];

    for (let i = 0; i < grades.length; i++) {
      const from = grades[i];
      const to = grades[i + 1];
      labels.push(
        `<i style="background:${getColor(from + 1)}"></i> ${from}${
          to ? `&ndash;${to}` : "+"
        }`
      );
    }

    div.innerHTML = labels.join("<br>");
    return div;
  };
  legend.addTo(map);

  // Info control (display details about a state)
  const info = L.control();
  info.onAdd = function () {
    this._div = L.DomUtil.create("div", "info");
    this.update();
    return this._div;
  };

  info.update = function (props) {
    this._div.innerHTML = props
      ? `<h4>State Details</h4>
            <b>${props.STATE}</b><br>
            ${
              currentVariable === "count" ? "Count" : "Project Submit Count"
            }: ${props.value}`
      : "Hover Over the State";
  };
  info.addTo(map);

  // Highlight feature on hover
  function highlightFeature(e) {
    const layer = e.target;
    layer.setStyle({
      weight: 3,
      color: "#666",
      dashArray: "",
      fillOpacity: 0.5,
    });

    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
      layer.bringToFront();
    }
    info.update(layer.feature.properties); // Update info control
  }

  // Reset style on mouseout
  function resetHighlight(e) {
    StateLayer.resetStyle(e.target); // Reset to default style
    info.update(); // Clear info box
  }

  // Show details on state click
  function showCount(e, feature) {
    info.update(feature.properties); // Update info control
  }

  window.addEventListener("resize", () => {
    map.invalidateSize();
  });
}
