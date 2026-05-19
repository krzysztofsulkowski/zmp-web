import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Log.module.css';

type HistoryLog = {
    creationDate: string;
    eventType: string;
    objectId: string;
    objectType: string;
    before: string;
    after: string;
    userId: string;
    userEmail: string;
};

type LogsResponse = {
    data: HistoryLog[];
};

export default function LogsPage() {
    const navigate = useNavigate();

    const [logs, setLogs] = useState<HistoryLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const loadLogs = async () => {
        try {
            const token = localStorage.getItem('authToken');

            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/historyLog/get-history-logs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    draw: 1,
                    start: 0,
                    length: 100,
                    searchValue: '',
                    orderColumn: 0,
                    orderDir: 'desc',
                    extraFilters: {}
                })
            });

            if (!response.ok) {
                throw new Error('Nie udało się pobrać logów.');
            }

            const data = await response.json() as LogsResponse;

            setLogs(data.data ?? []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Wystąpił nieoczekiwany błąd.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLogs();
    }, []);

    return (
        <main className={styles.page}>
            <section className={styles.panel}>
                <div className={styles.header}>
                    <div>
                        <h1>Logi systemowe</h1>
                        <p>Historia zmian wykonanych w aplikacji.</p>
                    </div>

                    <button onClick={() => navigate('/admin')}>
                        Wróć
                    </button>
                </div>

                {loading && <div className={styles.state}>Ładowanie logów...</div>}

                {!loading && error && <div className={styles.error}>{error}</div>}

                {!loading && !error && (
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Data</th>
                                    <th>Zdarzenie</th>
                                    <th>Użytkownik</th>
                                    <th>Obiekt</th>
                                    <th>ID</th>
                                    <th>Przed</th>
                                    <th>Po</th>
                                </tr>
                            </thead>

                            <tbody>
                                {logs.map((log, index) => (
                                    <tr key={`${log.creationDate}-${index}`}>
                                        <td>{new Date(log.creationDate).toLocaleString('pl-PL')}</td>
                                        <td>
                                            <span className={styles.badge}>
                                                {log.eventType}
                                            </span>
                                        </td>
                                        <td>{log.userEmail || '-'}</td>
                                        <td>{log.objectType || '-'}</td>
                                        <td className={styles.muted}>{log.objectId || '-'}</td>
                                        <td>
                                            <pre>{log.before || '-'}</pre>
                                        </td>
                                        <td>
                                            <pre>{log.after || '-'}</pre>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </main>
    );
}