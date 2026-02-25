// frontend/js/auth.js

async function login() {
    // 1. Capturamos los datos que ha escrito el usuario en el HTML
    // Asegúrate de que tus inputs en el HTML tengan id="email" e id="password"
    const emailInput = document.getElementById('email').value;
    const passwordInput = document.getElementById('password').value;

    console.log("Intentando entrar con:", emailInput);

    try {
        // 2. Enviamos los datos al servidor
        const response = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: emailInput,
                password: passwordInput
            })
        });

        const data = await response.json();

        // 3. Comprobamos la respuesta
        if (response.ok) {
            alert("¡Login correcto!");
            // Guardamos el token (si tu backend lo envía) o simplemente redirigimos
            localStorage.setItem('user', JSON.stringify(data.user));
 
            window.location.href = 'routes.html'; // <-- REDIRECCIÓN AL MAPA
        } else {
            alert("Error: " + (data.error || "Credenciales incorrectas"));
        }

    } catch (error) {
        console.error(error);
        alert("Error de conexión con el servidor (¿Está encendido?)");
    }
}