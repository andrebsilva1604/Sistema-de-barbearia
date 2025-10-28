document.addEventListener('DOMContentLoaded', () => {
    // FORÇA A PÁGINA A CARREGAR NO TOPO
    window.scrollTo(0, 0);

    // --- NOVO CÓDIGO PARA BUSCAR O NOME DO USUÁRIO ---
    const userNameDisplay = document.getElementById('user-name-display');
    if (userNameDisplay) {
        fetch('/api/me')
            .then(res => res.json())
            .then(data => {
                if (data.name) {
                    // Pega só o primeiro nome e exibe
                    userNameDisplay.textContent = `Olá, ${data.name.split(' ')[0]}`;
                }
            })
            .catch(err => console.error("Erro ao buscar nome do usuário:", err));
    }
    // --- FIM DO NOVO CÓDIGO ---

    // Seletores de elementos do DOM
    const servicesList = document.getElementById('services-list');
    const serviceSelect = document.getElementById('service');
    const barberSelect = document.getElementById('barber');
    const scheduleForm = document.getElementById('schedule-form');
    const dateInput = document.getElementById('date');
    const timeSelect = document.getElementById('time');

    // --- CÓDIGO DA NOTIFICAÇÃO (sem alterações) ---
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
    
    // Definir data mínima para hoje
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);

    // --- LÓGICA DE HORÁRIOS COM VERIFICAÇÃO DE AGENDAMENTO ---
    const horariosDisponiveis = [
        "08:00", "09:00", "10:00", "11:00", "12:00", 
        "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"
    ];

    async function popularHorarios() {
        const barberId = barberSelect.value;
        const selectedDate = dateInput.value;

        // 1. Só continua se um barbeiro E uma data forem selecionados
        if (!barberId || !selectedDate) {
            timeSelect.innerHTML = '<option value="">Selecione um barbeiro e uma data</option>';
            return;
        }

        try {
            // 2. Consulta a API para buscar os horários ocupados
            const response = await fetch(`/api/booked-slots?barber_id=${barberId}&date=${selectedDate}`);
            if (!response.ok) throw new Error('Falha ao buscar horários');
            const bookedSlots = await response.json(); // ex: ["09:00", "14:00"]

            timeSelect.innerHTML = '<option value="">Selecione um horário</option>';

            const hoje = new Date();
            const dataAtual = hoje.toISOString().split('T')[0];
            const horaAtual = hoje.getHours();

            // 3. Itera sobre os horários e só mostra os que estiverem LIVRES
            horariosDisponiveis.forEach(horario => {
                const horaDoSlot = parseInt(horario.split(':')[0]);

                const isBooked = bookedSlots.includes(horario);
                const isPast = (selectedDate === dataAtual && horaDoSlot <= horaAtual);

                // Só adiciona a opção se o horário NÃO estiver agendado E NÃO tiver passado
                if (!isBooked && !isPast) {
                    const option = document.createElement('option');
                    option.value = horario;
                    option.textContent = horario;
                    timeSelect.appendChild(option);
                }
            });

        } catch (error) {
            console.error("Erro ao buscar horários:", error);
            showToast("Erro ao carregar horários.", "error");
        }
    }

    // 4. Adiciona "ouvintes" para atualizar a lista
    dateInput.addEventListener('change', popularHorarios);
    barberSelect.addEventListener('change', popularHorarios);

    // --- FIM DA LÓGICA DE HORÁRIOS ---


    // Carregar serviços
    fetch('/api/services')
        .then(res => res.json())
        .then(services => {
            servicesList.innerHTML = '';
            serviceSelect.innerHTML = '<option value="">Selecione um serviço</option>';
            services.forEach(service => {
                servicesList.innerHTML += `
                    <div class="service-card">
                        <img src="${service.image_url}" alt="${service.name}" class="service-image">
                        <div class="service-info">
                            <h3>${service.name}</h3>
                            <p>${service.description}</p>
                            <div class="price">R$ ${service.price.toFixed(2).replace('.', ',')}</div>
                        </div>
                    </div>
                `;
                serviceSelect.innerHTML += `<option value="${service.id}">${service.name} - R$ ${service.price.toFixed(2).replace('.', ',')}</option>`;
            });
        });

    // Carregar barbeiros
    fetch('/api/barbers')
        .then(res => res.json())
        .then(barbers => {
            barberSelect.innerHTML = '<option value="">Selecione um profissional</option>';
            barbers.forEach(barber => {
                barberSelect.innerHTML += `<option value="${barber.id}">${barber.name}</option>`;
            });
        });

    // Enviar formulário de agendamento (COM BOTÃO DESABILITADO)
    scheduleForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitButton = scheduleForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Agendando...';

        const scheduleData = {
            service_id: serviceSelect.value,
            barber_id: barberSelect.value,
            date: dateInput.value,
            time: timeSelect.value
        };

        if (!scheduleData.service_id || !scheduleData.barber_id || !scheduleData.date || !scheduleData.time) {
            showToast('Por favor, preencha todos os campos.', 'error');
            submitButton.disabled = false;
            submitButton.textContent = 'CONFIRMAR AGENDAMENTO';
            return;
        }

        try {
            const response = await fetch('/api/schedule', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify(scheduleData)
            });

            const result = await response.json();

            if (response.ok) {
                showToast('Agendamento realizado com sucesso!', 'success');
                scheduleForm.reset();
                dateInput.setAttribute('min', today);
                popularHorarios(); // Limpa e atualiza os horários
            } else {
                showToast(result.message || 'Erro ao agendar.', 'error');
                popularHorarios(); // Atualiza a lista para remover o horário conflitante
            }
        } catch (error) {
            showToast('Erro de conexão. Tente novamente.', 'error');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'CONFIRMAR AGENDAMENTO';
        }
    });

    // Lógica do botão sair
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            await fetch('/api/logout', { method: 'POST' });
            window.location.href = '/login';
        });
    }
});
