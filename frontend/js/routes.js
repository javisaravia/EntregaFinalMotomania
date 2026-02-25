const map = L.map('map').setView([40.4, -3.7], 8);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

let points = [];

map.on('click', e => {
  points.push(e.latlng);
  L.marker(e.latlng).addTo(map);
});

function saveRoute() {
  fetch('http://localhost:3000/api/routes', {
    method: 'POST',
    headers: {
      'Content-Type':'application/json',
      'Authorization': localStorage.getItem('token')
    },
    body: JSON.stringify({
      name: 'Ruta prueba',
      origin_lat: points[0].lat,
      origin_lng: points[0].lng,
      dest_lat: points[1].lat,
      dest_lng: points[1].lng
    })
  });
}