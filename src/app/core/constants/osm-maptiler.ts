export const mapLayers = {
  outdoor: {
    name: "Outdoor",
    url: "https://api.maptiler.com/maps/outdoor-v2/256/{z}/{x}/{y}.png?key=vFA1CHNlkXPAh78cSiPT",
    attribution:
      '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>',
  },
  satellite: {
    name: "Satellite",
    url: "https://api.maptiler.com/maps/hybrid-v4/256/{z}/{x}/{y}.jpg?key=vFA1CHNlkXPAh78cSiPT",
    attribution:
      '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>',
  },
  base: {
    name: "Base",
    url: "https://api.maptiler.com/maps/basic-v2/256/{z}/{x}/{y}.png?key=vFA1CHNlkXPAh78cSiPT",
    attribution:
      '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>',
  },
  streets: {
    name: "Streets",
    url: "https://api.maptiler.com/maps/streets-v2/256/{z}/{x}/{y}.png?key=vFA1CHNlkXPAh78cSiPT",
    attribution:
      '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>',
  },
  landscape: {
    name: "Landscape",
    url: "https://api.maptiler.com/maps/landscape/256/{z}/{x}/{y}.png?key=vFA1CHNlkXPAh78cSiPT",
    attribution:
      '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>',
  },
  topo: {
    name: "Topo",
    url: "https://api.maptiler.com/maps/topo-v2/256/{z}/{x}/{y}.png?key=vFA1CHNlkXPAh78cSiPT",
    attribution:
      '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>',
  },
  dataviz: {
    name: "Dataviz",
    url: "https://api.maptiler.com/maps/dataviz/256/{z}/{x}/{y}.png?key=vFA1CHNlkXPAh78cSiPT",
    attribution:
      '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>',
  },
};

export default {
  maptiler: mapLayers.satellite,
};
