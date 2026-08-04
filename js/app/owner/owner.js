import { util } from '../../common/util.js';
import { theme } from '../../common/theme.js';
import { storage } from '../../common/storage.js';
import { pool, request, HTTP_GET, HTTP_POST, HTTP_PATCH, HTTP_DELETE, HTTP_STATUS_OK, HTTP_STATUS_CREATED } from '../../connection/request.js';

export const owner = (() => {

    const OWNER_STORAGE_KEY = 'owner_key';

    /**
     * @type {ReturnType<typeof storage>|null}
     */
    let own = null;

    /**
     * @type {object|null}
     */
    let editingClient = null;

    /**
     * @returns {string|null}
     */
    const getKey = () => own.get(OWNER_STORAGE_KEY);

    /**
     * @param {string} key
     * @returns {void}
     */
    const setKey = (key) => own.set(OWNER_STORAGE_KEY, key);

    /**
     * @returns {string|null}
     */
    const getKeyFromInput = () => {
        const el = document.getElementById('owner-key');
        return el.value.trim().length > 0 ? el.value.trim() : null;
    };

    /**
     * @returns {void}
     */
    const showSections = () => {
        document.getElementById('section-register').style.display = '';
        document.getElementById('section-clients').style.display = '';
    };

    /**
     * @returns {void}
     */
    const toggleKeyVisibility = () => {
        const input = document.getElementById('owner-key');
        const icon = document.getElementById('owner-key-icon');

        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.replace('fa-eye', 'fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.replace('fa-eye-slash', 'fa-eye');
        }
    };

    /**
     * @param {Array<{id: number, name: string, email: string, access_key: string, is_active: boolean, created_at: string}>} clients
     * @returns {void}
     */
    const renderClients = (clients) => {
        const tbody = document.getElementById('clients-body');

        if (!clients || clients.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted small py-3">Belum ada klien.</td></tr>';
            return;
        }

        tbody.innerHTML = '';

        clients.forEach((client, index) => {
            const tr = document.createElement('tr');

            const statusBadge = client.is_active
                ? '<span class="badge bg-success rounded-pill">Aktif</span>'
                : '<span class="badge bg-secondary rounded-pill">Nonaktif</span>';

            tr.innerHTML = `
                <td class="small">${index + 1}</td>
                <td class="small fw-semibold">${util.escapeHtml(client.name)}</td>
                <td class="small d-none d-sm-table-cell">${util.escapeHtml(client.email)}</td>
                <td class="small">${statusBadge}</td>
                <td class="small text-end">
                    <div class="btn-group btn-group-sm" role="group">
                        <button class="btn btn-outline-primary rounded-start-4" onclick="undangan.owner.openEdit(${client.id})" title="Edit">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button class="btn btn-outline-warning" onclick="undangan.owner.rotateKey(${client.id})" title="Rotate Key">
                            <i class="fa-solid fa-rotate"></i>
                        </button>
                        <button class="btn btn-outline-danger rounded-end-4" onclick="undangan.owner.deleteClient(${client.id}, '${util.escapeHtml(client.name)}')" title="Hapus">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;

            tbody.appendChild(tr);
        });
    };

    /**
     * @returns {void}
     */
    const loadClients = () => {
        const tbody = document.getElementById('clients-body');
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted small py-3"><span class="spinner-border spinner-border-sm"></span></td></tr>';

        request(HTTP_GET, '/api/owner/clients')
            .token(getKey())
            .send()
            .then((res) => {
                if (res.code !== HTTP_STATUS_OK) {
                    return;
                }

                renderClients(res.data);
            })
            .catch(() => {
                tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger small py-3">Gagal memuat data.</td></tr>';
            });
    };

    /**
     * @param {HTMLButtonElement} button
     * @returns {void}
     */
    const saveKey = (button) => {
        const key = getKeyFromInput();

        if (!key) {
            util.notify('Masukkan owner key.').warning();
            return;
        }

        const btn = util.disableButton(button);

        request(HTTP_GET, '/api/owner/clients')
            .token(key)
            .send()
            .then((res) => {
                if (res.code !== HTTP_STATUS_OK) {
                    return;
                }

                setKey(key);
                document.getElementById('section-key').style.display = 'none';
                showSections();
                util.notify('Key tersimpan.').success();
                loadClients();
            })
            .finally(() => btn.restore());
    };

    /**
     * @returns {void}
     */
    const refreshClients = () => loadClients();

    /**
     * @param {HTMLButtonElement} button
     * @returns {void}
     */
    const register = (button) => {
        const name = document.getElementById('reg-name');
        const email = document.getElementById('reg-email');
        const tz = document.getElementById('reg-tz');

        if (name.value.trim().length === 0 || email.value.trim().length === 0) {
            util.notify('Nama dan email wajib diisi.').warning();
            return;
        }

        name.disabled = true;
        email.disabled = true;
        tz.disabled = true;

        const btn = util.disableButton(button);

        const body = {
            name: name.value.trim(),
            email: email.value.trim(),
        };

        if (tz.value.trim().length > 0) {
            body.tz = tz.value.trim();
        }

        request(HTTP_POST, '/api/owner/register')
            .token(getKey())
            .body(body)
            .send()
            .then((res) => {
                if (res.code !== HTTP_STATUS_CREATED) {
                    return;
                }

                document.getElementById('result-name').value = res.data.name;
                document.getElementById('result-email').value = res.data.email;
                document.getElementById('result-password').value = res.data.password;
                document.getElementById('result-accesskey').value = res.data.access_key;
                document.getElementById('btn-copy-password').setAttribute('data-copy', res.data.password);
                document.getElementById('btn-copy-accesskey').setAttribute('data-copy', res.data.access_key);

                window.bootstrap.Modal.getOrCreateInstance(document.getElementById('resultModal')).show();

                name.value = '';
                email.value = '';
                tz.value = '';

                loadClients();
            })
            .finally(() => {
                btn.restore();
                name.disabled = false;
                email.disabled = false;
                tz.disabled = false;
            });
    };

    /**
     * @param {number} id
     * @returns {void}
     */
    const openEdit = (id) => {
        request(HTTP_GET, '/api/owner/clients')
            .token(getKey())
            .send()
            .then((res) => {
                if (res.code !== HTTP_STATUS_OK) {
                    return;
                }

                const client = res.data.find((c) => c.id === id);

                if (!client) {
                    util.notify('Klien tidak ditemukan.').error();
                    return;
                }

                editingClient = client;

                document.getElementById('edit-name').value = client.name;
                document.getElementById('edit-email').value = client.email;
                document.getElementById('edit-password').value = '';
                document.getElementById('edit-active').checked = Boolean(client.is_active);

                window.bootstrap.Modal.getOrCreateInstance(document.getElementById('editModal')).show();
            });
    };

    /**
     * @param {HTMLButtonElement} button
     * @returns {void}
     */
    const saveEdit = (button) => {
        if (!editingClient) {
            return;
        }

        const name = document.getElementById('edit-name');
        const email = document.getElementById('edit-email');
        const password = document.getElementById('edit-password');
        const active = document.getElementById('edit-active');

        const btn = util.disableButton(button);

        const body = {};

        if (name.value.trim().length > 0 && name.value.trim() !== editingClient.name) {
            body.name = name.value.trim();
        }

        if (email.value.trim().length > 0 && email.value.trim() !== editingClient.email) {
            body.email = email.value.trim();
        }

        if (password.value.trim().length > 0) {
            body.password = password.value.trim();
        }

        body.is_active = active.checked;

        request(HTTP_PATCH, `/api/owner/client/${editingClient.id}`)
            .token(getKey())
            .body(body)
            .send()
            .then((res) => {
                if (res.code !== HTTP_STATUS_OK) {
                    return;
                }

                window.bootstrap.Modal.getOrCreateInstance(document.getElementById('editModal')).hide();
                util.notify('Klien diperbarui.').success();
                loadClients();
            })
            .finally(() => btn.restore());
    };

    /**
     * @param {number} id
     * @param {string} name
     * @returns {void}
     */
    const deleteClient = (id, name) => {
        if (!util.ask(`Hapus klien "${name}"?`)) {
            return;
        }

        request(HTTP_DELETE, `/api/owner/client/${id}`)
            .token(getKey())
            .send()
            .then((res) => {
                if (res.code !== HTTP_STATUS_OK) {
                    return;
                }

                util.notify('Klien dihapus.').success();
                loadClients();
            });
    };

    /**
     * @param {number} id
     * @returns {void}
     */
    const rotateKey = (id) => {
        if (!util.ask('Generate access key baru?')) {
            return;
        }

        request(HTTP_PATCH, `/api/owner/client/${id}`)
            .token(getKey())
            .body({ rotate_key: true })
            .send()
            .then((res) => {
                if (res.code !== HTTP_STATUS_OK) {
                    return;
                }

                util.notify('Access key baru dibuat.').success();
                loadClients();
            });
    };

    /**
     * @param {HTMLElement} el
     * @returns {void}
     */
    const copy = (el) => {
        const text = el.closest('.input-group').querySelector('input').value;

        if (!text) {
            return;
        }

        navigator.clipboard.writeText(text).then(() => {
            util.notify('Disalin!').success();
        }).catch(() => {
            util.notify('Gagal menyalin.').error();
        });
    };

    /**
     * @returns {void}
     */
    const pageLoaded = () => {
        theme.init();
        theme.spyTop();

        const savedKey = getKey();

        if (savedKey) {
            document.getElementById('section-key').style.display = 'none';
            showSections();
            loadClients();
        }
    };

    /**
     * @returns {object}
     */
    const init = () => {
        own = storage('owner');
        window.addEventListener('load', () => pool.init(pageLoaded));

        return {
            theme,
            owner: {
                toggleKeyVisibility,
                saveKey,
                register,
                refreshClients,
                openEdit,
                saveEdit,
                deleteClient,
                rotateKey,
                copy,
            },
        };
    };

    return {
        init,
    };
})();
