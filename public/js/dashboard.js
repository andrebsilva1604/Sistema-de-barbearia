document.addEventListener('DOMContentLoaded', () => {
    const appointmentsList = document.getElementById('appointments-list');
    const logoutButton = document.getElementById('logout-button');
    const userNameDisplay = document.getElementById('user-name-display');

    // --- LÓGICA DO MODAL DE CONFIRMAÇÃO ---
    const modal = document.getElementById('confirmation-modal');
    const btnConfirm = document.getElementById('modal-btn-confirm');
    const btnCancel = document.getElementById('modal-btn-cancel');
    let appointmentToCancelId = null;

    // --- LÓGICA DE NOTIFICAÇÃO (TOAST) ---
    const toast = document.getElementById('toast-notification');
    let toastTimeout;
    function showToast(message, type = 'success') {
        clearTimeout(toastTimeout);
        toast.textContent = message;
        toast.className = 'toast-visible';
        toast.classList.add(`toast-${type}`);
        toastTimeout = setTimeout(() => {
            toast.className = 'toast-hidden';
        }, 5000);
    }
    
    // --- FUNÇÕES DO MODAL ---
    function openModal(id) {
        appointmentToCancelId = id;
        if(modal) modal.style.display = 'flex';
    }

    function closeModal() {
        appointmentToCancelId = null;
        if(modal) modal.style.display = 'none';
    }

    // --- FUNÇÃO PARA CANCELAR O AGENDAMENTO ---
    async function cancelAppointment() {
        if (!appointmentToCancelId) return;

        try {
            const response = await fetch(`/api/appointments/${appointmentToCancelId}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (response.ok) {
                // Remove o card da tela
                const cardToRemove = document.getElementById(`appointment-${appointmentToCancelId}`);
                if(cardToRemove) cardToRemove.remove();
                
                // Verifica se a lista está vazia
                if(appointmentsList.children.length === 0) {
                     appointmentsList.innerHTML = '<p>Você não tem nenhum agendamento.</p>';
                }

                showToast(result.message, 'success');
            } else {
                showToast(result.message, 'error');
            }
        } catch (error) {
            showToast("Erro de conexão ao tentar cancelar.", 'error');
        } finally {
            closeModal();
        }
    }

    // --- OUVINTES DOS BOTÕES DO MODAL ---
    if(btnCancel) btnCancel.addEventListener('click', closeModal);
    if(btnConfirm) btnConfirm.addEventListener('click', cancelAppointment);

    // --- BUSCA NOME DO USUÁRIO ---
    if (userNameDisplay) {
        fetch('/api/me')
            .then(res => res.json())
            .then(data => {
                if (data.name) {
                    userNameDisplay.textContent = `Olá, ${data.name.split(' ')[0]}`;
                }
            })
            .catch(err => console.error("Erro ao buscar nome do usuário:", err));
    }

    // --- CARREGA OS AGENDAMENTOS (MODIFICADO COM O BOTÃO) ---
    fetch('/api/my-appointments')
        .then(res => res.ok ? res.json() : Promise.reject(res))
        .then(appointments => {
            if (appointments.length === 0) {
                appointmentsList.innerHTML = '<p>Você não tem nenhum agendamento.</p>';
            } else {
                // --- CÓDIGO ATUALIZADO AQUI ---
                // Agora o card tem uma div "info" e o botão, para alinhar com flexbox
                appointmentsList.innerHTML = appointments.map(app => `
                    <div class="appointment-card" id="appointment-${app.id}">
                        <div class="appointment-info">
                            <p><strong>Serviço:</strong> ${app.service_name}</p>
                            <p><strong>Barbeiro:</strong> ${app.barber_name}</p>
                            <p><strong>Data:</strong> ${new Date(app.schedule_date).toLocaleDateString()}</p>
                            <p><strong>Hora:</strong> ${app.schedule_time}</p>
                        </div>
                        <button class="cancel-button" data-id="${app.id}">Cancelar</button>
                    </div>
                `).join('');
            }
        })
        .catch(() => window.location.href = '/login');

    // --- OUVINTE PARA OS BOTÕES "CANCELAR" (Event Delegation) ---
    appointmentsList.addEventListener('click', (e) => {
        if (e.target && e.target.classList.contains('cancel-button')) {
            const id = e.target.dataset.id;
            openModal(id);
        }
    });

    // Lógica do botão Sair
    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            await fetch('/api/logout', { method: 'POST' });
            window.location.href = '/login';
        });
    }

    // --- LÓGICA DAS ESTATÍSTICAS ---
    const showStatsButton = document.getElementById('show-stats-button');
    const statsContainer = document.getElementById('stats-container');
    let chartsCreated = false;

    if (showStatsButton) {
        showStatsButton.addEventListener('click', async () => {
            if (chartsCreated) {
                const isVisible = statsContainer.style.display === 'flex';
                statsContainer.style.display = isVisible ? 'none' : 'flex';
                return;
            }
            try {
                const response = await fetch('/api/stats');
                if (!response.ok) throw new Error('Falha ao buscar dados');
                const stats = await response.json();
                const servicesLabels = stats.popularServices.map(s => s.name);
                const servicesData = stats.popularServices.map(s => s.count);
                const barbersLabels = stats.busiestBarbers.map(b => b.name);
                const barbersData = stats.busiestBarbers.map(b => b.count);

                new Chart(document.getElementById('services-chart'), {
                    type: 'bar',
                    data: {
                        labels: servicesLabels,
                        datasets: [{
                            label: 'Nº de Agendamentos',
                            data: servicesData,
                            backgroundColor: 'rgba(212, 175, 55, 0.6)',
                            borderColor: 'rgba(212, 175, 55, 1)',
                            borderWidth: 1
                        }]
                    },
                    options: { scales: { y: { beginAtZero: true } } }
                });

                new Chart(document.getElementById('barbers-chart'), {
                    type: 'bar',
                    data: {
                        labels: barbersLabels,
                        datasets: [{
                            label: 'Nº de Agendamentos',
                            data: barbersData,
                            backgroundColor: 'rgba(239, 239, 239, 0.6)',
                            borderColor: 'rgba(239, 239, 239, 1)',
                            borderWidth: 1
                        }]
                    },
                    options: { scales: { y: { beginAtZero: true } } }
                });

                statsContainer.style.display = 'flex';
                chartsCreated = true;
            } catch (error) {
                console.error("Erro ao carregar estatísticas", error);
            }
        });
    }
});

