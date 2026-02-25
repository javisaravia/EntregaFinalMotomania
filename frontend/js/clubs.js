fetch('http://localhost:3000/api/clubs')
  .then(r => r.json())
  .then(clubs => {
    clubs.forEach(c => {
      const li = document.createElement('li');
      li.innerHTML = `${c.name} <button onclick="join(${c.id})">Unirse</button>`;
      clubsList.appendChild(li);
    });
  });

  function join(id) {
  fetch(`http://localhost:3000/api/clubs/${id}/join`, {
    method:'POST',
    headers:{'Authorization':localStorage.getItem('token')}
  });
}