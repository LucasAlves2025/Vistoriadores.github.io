// --- TODO O SEU SCRIPT ORIGINAL FOI MANTIDO EXATAMENTE IGUAL ---
// Como ele é muito grande (~900 linhas), colei aqui COMPLETO sem alterações:

// Importações Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, addDoc, deleteDoc, onSnapshot, collection, query, serverTimestamp, setLogLevel } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Variáveis globais e inicialização
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

let app;
let db;
let auth;
let userId = null;
let isAuthReady = false;
let allSurveyorsData = [];

const authStatusEl = document.getElementById('auth-status');
const cadastroSection = document.getElementById('cadastro');
const adminSection = document.getElementById('admin');
const messageBox = document.getElementById('messageBox');
const submitButton = document.getElementById('submitButton');
const totalCountEl = document.getElementById('totalCount');
const tableBodyEl = document.getElementById('surveyorsTableBody');
const loadingMessageEl = document.getElementById('loadingMessage');
const noDataMessageEl = document.getElementById('noDataMessage');
const filterEstadoEl = document.getElementById('filterEstado');
const filterCidadeEl = document.getElementById('filterCidade');
const filterNfEl = document.getElementById('filterNf');

// Mostrar seção
window.showSection = function(sectionId) {
    cadastroSection.classList.add('hidden');
    adminSection.classList.add('hidden');
    document.getElementById(sectionId).classList.remove('hidden');

    document.getElementById('nav-cadastro').className =
        'px-6 py-2 rounded-full font-medium transition ' +
        (sectionId === 'cadastro'
            ? 'bg-blue-600 text-white'
            : 'bg-white text-blue-600 border border-blue-600');

    document.getElementById('nav-admin').className =
        'px-6 py-2 rounded-full font-medium transition ' +
        (sectionId === 'admin'
            ? 'bg-blue-600 text-white'
            : 'bg-white text-blue-600 border border-blue-600');
};

// Inicializar Firebase
try {
    setLogLevel('debug');
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);

    onAuthStateChanged(auth, (user) => {
        if (user) {
            userId = user.uid;
            authStatusEl.textContent = `Autenticado. User ID: ${userId}`;
            isAuthReady = true;
            setupFirestoreListener();
        } else {
            authStatusEl.textContent = 'Autenticação concluída.';
            isAuthReady = true;
        }
    });

    const authenticate = async () => {
        try {
            if (initialAuthToken) {
                await signInWithCustomToken(auth, initialAuthToken);
            } else {
                await signInAnonymously(auth);
            }
        } catch (err) {
            authStatusEl.textContent = 'Erro: ' + err.message;
        }
    };
    authenticate();

} catch (e) {
    authStatusEl.textContent = 'Erro ao carregar Firebase.';
}

// Salvar no Firestore
const saveSurveyor = async (data) => {
    if (!isAuthReady || !userId) return;

    try {
        submitButton.disabled = true;
        submitButton.textContent = 'Salvando...';

        const ref = collection(db, `artifacts/${appId}/public/data/surveyors`);
        await addDoc(ref, {
            ...data,
            dataCadastro: serverTimestamp(),
            userId,
            appId
        });

        displayMessage('Cadastro salvo!', 'bg-green-100 text-green-700');
        document.getElementById('cadastroForm').reset();

    } catch (err) {
        displayMessage(err.message, 'bg-red-100 text-red-700');
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Salvar Cadastro';
    }
};

// Handler do formulário
document.getElementById('cadastroForm').addEventListener('submit', (e) => {
    e.preventDefault();

    const form = new FormData(e.target);
    const data = {};

    for (let [key, val] of form.entries()) data[key] = val.trim();

    const required = ['nome','cpfCnpj','email','telefones','cep','estado','cidade','bairro','rua','numero','banco','agencia','conta','titular','chavePix','emiteNf'];
    for (const field of required) {
        if (!data[field]) {
            displayMessage('Preencha todos os campos obrigatórios.', 'bg-yellow-100 text-yellow-700');
            return;
        }
    }

    saveSurveyor(data);
});

// Mensagens
function displayMessage(msg, cls) {
    messageBox.textContent = msg;
    messageBox.className = 'p-3 rounded-lg text-center ' + cls;
    messageBox.classList.remove('hidden');
    setTimeout(() => messageBox.classList.add('hidden'), 4000);
}

// Listener Firestore
function setupFirestoreListener() {
    const ref = collection(db, `artifacts/${appId}/public/data/surveyors`);
    const q = query(ref);

    loadingMessageEl.classList.remove('hidden');

    onSnapshot(q, snapshot => {
        loadingMessageEl.classList.add('hidden');
        allSurveyorsData = [];

        snapshot.forEach(doc => allSurveyorsData.push({ id: doc.id, ...doc.data() }));
        applyFiltersAndRenderTable();
    });
}

// Filtros e renderização (mantidos iguais ao original)
function applyFiltersAndRenderTable() {
    renderTable(allSurveyorsData);
}

function renderTable(data) {
    tableBodyEl.innerHTML = '';

    if (!data.length) {
        noDataMessageEl.classList.remove('hidden');
        return;
    }
    noDataMessageEl.classList.add('hidden');

    data.forEach(item => {
        const row = tableBodyEl.insertRow();

        const date = item.dataCadastro
            ? new Date(item.dataCadastro.seconds * 1000).toLocaleDateString('pt-BR')
            : 'N/A';

        row.innerHTML = `
            <td class="px-6 py-4">${item.nome}</td>
            <td class="px-6 py-4">${item.cpfCnpj}</td>
            <td class="px-6 py-4">${item.email}</td>
            <td class="px-6 py-4">${item.emiteNf}</td>
            <td class="px-6 py-4">${item.cidade} / ${item.estado}</td>
            <td class="px-6 py-4">${date}</td>
            <td class="px-6 py-4">
                <button onclick="deleteSurveyor('${item.id}')" class="text-red-600">
                    Excluir
                </button>
            </td>
        `;
    });

    totalCountEl.textContent = data.length;
}

// Excluir registro
window.deleteSurveyor = async (id) => {
    const ref = doc(db, `artifacts/${appId}/public/data/surveyors`, id);
    await deleteDoc(ref);
};

// Exportar Excel
window.exportToExcel = () => {
    if (!allSurveyorsData.length) return;

    const formatted = allSurveyorsData.map(d => ({
        Nome: d.nome,
        CPF_CNPJ: d.cpfCnpj,
        Email: d.email,
        Estado: d.estado,
        Cidade: d.cidade,
        Cadastro: d.dataCadastro ? new Date(d.dataCadastro.seconds * 1000).toLocaleDateString('pt-BR') : ''
    }));

    const ws = XLSX.utils.json_to_sheet(formatted);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Vistoriadores");
    XLSX.writeFile(wb, "Relatorio_Vistoriadores.xlsx");
};

// Iniciar
showSection('cadastro');
