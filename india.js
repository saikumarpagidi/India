// get color depending on value variable
function getColor(d) {
  return d > 100
    ? "#023858"
    : d > 80
    ? "#045a8d"
    : d > 60
    ? "#0570b0"
    : d > 50
    ? "#3690c0"
    : d > 40
    ? "#74a9cf"
    : d > 20
    ? "#a6bddb"
    : d > 10
    ? "#d0d1e6"
    : d > 50
    ? "#ece7f2"
    : "#fff7fb";
}

function style(feature) {
  return {
    weight: 2,
    opacity: 1,
    color: "white",
    fillOpacity: 0.7,
    fillColor: getColor(feature.properties.value),
  };
}
