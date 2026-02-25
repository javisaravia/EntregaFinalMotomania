/**
 * Sistema de Notificaciones Toast y Spinner de carga
 * MotoManía - UI/UX Senior Polish
 */

// 1. Mostrar Notificación Toast
function mostrarToast(mensaje, tipo = 'success') {
    let container = document.getElementById('toast-container');

    // Si no existe el contenedor, lo creamos
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;

    const icon = tipo === 'success' ? '✅' : '❌';

    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span class="toast-message">${mensaje}</span>
    `;

    container.appendChild(toast);

    // Animación de entrada y salida
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);

    // Eliminar después de 3 segundos
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

// 2. Control del Spinner de Carga
function toggleSpinner(show) {
    let spinner = document.getElementById('loading-spinner');

    // Si no existe, lo creamos (Overlay + Spinner)
    if (!spinner) {
        spinner = document.createElement('div');
        spinner.id = 'loading-spinner';
        spinner.innerHTML = '<div class="spinner"></div>';
        document.body.appendChild(spinner);
    }

    if (show) {
        spinner.classList.add('active');
    } else {
        spinner.classList.remove('active');
    }
}
