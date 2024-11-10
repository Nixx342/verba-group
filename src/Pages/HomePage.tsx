import React, {useEffect, useState} from "react";
import { v4 as uuidv4 } from 'uuid';
import '../Styles/HomePage.css'
import TaskComponent from "../Components/Task.tsx";

interface HomePageProps {
    onLogout: () => void;
}
interface Task {
    id: string;
    status: string;
    name: string;
}

function openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject): void => {
        const request: IDBOpenDBRequest = indexedDB.open("taskDB", 1)
        request.onupgradeneeded = (event: IDBVersionChangeEvent): void => {
            const db: IDBDatabase = (event.target as IDBOpenDBRequest).result
            const objectStore: IDBObjectStore = db.createObjectStore("taskTable", { keyPath: "id" })
            objectStore.createIndex("status", "status", { unique: false })
            objectStore.createIndex("name", "name", { unique: false })
            console.log("Хранилище taskTable создано")
        };
        request.onsuccess = (event: Event): void => {
            const db: IDBDatabase = (event.target as IDBOpenDBRequest).result
            resolve(db)
        };
        request.onerror = (event: Event): void => {
            reject((event.target as IDBOpenDBRequest).error)
        };
    });
}



const HomePage: React.FC<HomePageProps> = ({ onLogout }) => {
    const [db, setDb] = useState<IDBDatabase | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [taskName, setTaskName] = useState<string>('');
    const [activeBoard, setActiveBoard] = useState<string>('current')
    const [filterTasks, setFilterTasks] = useState<Task[]>([]);
    useEffect(() => {
        let filtered
        if (activeBoard === 'all') {
            filtered = filterStatusTask(tasks, ['current', 'completed'])
        } else {
            filtered = filterStatusTask(tasks, [activeBoard])
        }
        setFilterTasks(filtered);
    }, [tasks]);
    useEffect(():() => void => {
        openDatabase()
            .then((database: IDBDatabase):void => {
                setDb(database)
                loadTasks(database)
                console.log("БД успешно подключена")
            })
            .catch((err: Error): void => {
                console.error("Ошибка при подключении к БД: ",err);
            })
        return (): void => {
            if (db) {
                db.close()
                console.log("Соединение с БД закрыто")
            }
        }
    }, [])
    const loadTasks = (db: IDBDatabase)  => {
        if(!db.objectStoreNames.contains("taskTable")) {
            console.error("Хранилище taskTable не существует")
            return;
        }
        const transaction: IDBTransaction = db.transaction("taskTable", "readonly");
        const objectStore: IDBObjectStore = transaction.objectStore("taskTable");
        const request = objectStore.getAll()

        request.onsuccess = (): void => {
            setTasks(request.result)
        }

        request.onerror = (): void => {
            console.error("Ошибка загрузки задач: ",request.error)
        }
    }
    const addTask = () => {
        if (!taskName.trim()) {
            alert("Введите название задачи!!!")
            return
        }
        if(!db) {
            console.error("БД не инициализирована")
            return;
        }
        try {
            const transaction = db.transaction("taskTable", "readwrite")
            const objectStore: IDBObjectStore = transaction.objectStore("taskTable");
            const task: Task = {
                id: uuidv4(),
                status: 'current',
                name: taskName,
            }
            const addRequest = objectStore.add(task)

            addRequest.onsuccess = (): void => {
                setTaskName("")
                loadTasks(db)
                console.log(`Задача "${task.name}" успешно добавлена`)
            }
            transaction.oncomplete = (): void => {
                console.log('Транзакция успешно завершена')
            }
            transaction.onerror = (): void => {
                console.error('Ошибка при выполнении транзакции: ',transaction.error)
            }
        } catch (err) {
            console.error('Ошибка при добавлении задачи:', err)
        }

    }
    const clearTrash = () => {
        filterTasks.map(task => {
            removeTask(task)
        })
    }
    const removeTask = (task: Task) => {
        if(!db) {
            console.error("БД не инициализирована")
            return;
        }
        try {
            const transaction = db.transaction("taskTable", "readwrite")
            const objectStore: IDBObjectStore = transaction.objectStore("taskTable");
            const deleteRequest = objectStore.delete(task.id)

            deleteRequest.onsuccess = (): void => {
                loadTasks(db)
                console.log(`Задача ${task.name} успешно удалена`)
            }
            deleteRequest.onerror = (): void => {
                console.error(`Ошибка при удалении задачи ${task.name}: `, deleteRequest.error)
            }
        } catch (err) {
            console.error('Ошибка при удалении задачи задачи:', err)
        }
    }
    const deleteAllTasks = () => {
        if (!db) {
            console.error("БД не инициализирована");
            return;
        }

        try {
            const transaction = db.transaction("taskTable", "readwrite");
            const objectStore = transaction.objectStore("taskTable");

            filterTasks.forEach((task: Task) => {
                const updatedTask = { ...task, status: 'deleted' };
                const updateRequest = objectStore.put(updatedTask);

                updateRequest.onsuccess = () => {
                    console.log(`Статус задачи ${task.name} изменен на 'deleted'`);
                };

                updateRequest.onerror = () => {
                    console.error('Ошибка при обновлении статуса задачи:', updateRequest.error);
                };
            });

            transaction.oncomplete = () => {
                loadTasks(db); // Загружаем задачи после завершения транзакции
                console.log("Все задачи успешно обновлены.");
            };

            transaction.onerror = () => {
                console.error("Ошибка при выполнении транзакции:", transaction.error);
            };
        } catch (err) {
            console.error("Ошибка при обновлении задачи:", err);
        }
    };
    const deletedTask = (task: Task) => {
        if (!db) {
            console.error("БД не инициализирована")
            return
        }
        let newStatus: string
        try {
            const transaction = db.transaction("taskTable", "readwrite")
            const objectStore = transaction.objectStore("taskTable")
            if(task.status === 'deleted') {
                newStatus = 'current'
            } else {
                newStatus = 'deleted'
            }
            const updatedTask = { ...task, status: newStatus }
            const updateRequest = objectStore.put(updatedTask)

            updateRequest.onsuccess = (): void => {
                loadTasks(db)
                console.log(`Статус задачи ${task.name} изменен на ${newStatus}`)
            }

            updateRequest.onerror = (): void => {
                console.error('Ошибка при обновлении статуса задачи:', updateRequest.error)
            }
        } catch (err) {
            console.error('Ошибка при обновлении задачи:', err)
        }
    }
    const changeTaskStatus = (task: Task) => {
        if (!db) {
            console.error("БД не инициализирована")
            return
        }
        let newStatus: string
        try {
            const transaction = db.transaction("taskTable", "readwrite")
            const objectStore = transaction.objectStore("taskTable")
            if(task.status === 'current') {
                newStatus = 'completed'
            } else {
                newStatus = 'current'
            }
            const updatedTask = { ...task, status: newStatus }
            const updateRequest = objectStore.put(updatedTask)

            updateRequest.onsuccess = (): void => {
                loadTasks(db)
                console.log(`Статус задачи ${task.name} изменен на ${newStatus}`)
            }

            updateRequest.onerror = (): void => {
                console.error('Ошибка при обновлении статуса задачи:', updateRequest.error)
            }
        } catch (err) {
            console.error('Ошибка при обновлении задачи:', err)
        }
    }
    const filterStatusTask = (tasks: Task[], statuses: string[]) : Task[] => {
        return tasks.filter((task: Task) => statuses.includes(task.status))
    }
    const changeBoard = (boardName: string) => {
        setActiveBoard(boardName)
        switch (boardName) {
            case "current":
                setFilterTasks(filterStatusTask(tasks, ["current"]))
                console.log(filterTasks)
                return
            case "all":
                setFilterTasks(filterStatusTask(tasks, ["current", "completed"]))
                console.log(filterTasks)
                return
            case "completed":
                setFilterTasks(filterStatusTask(tasks, ["completed"]))
                console.log(filterTasks)
                return
            case "deleted":
                setFilterTasks(filterStatusTask(tasks, ["deleted"]))
                console.log(filterTasks)
                return
        }
    }

    return(
        <div className='home-page'>
            <header className="header">
                <button
                    onClick={() => onLogout()}
                    className="header__logout-button"
                >Выйти</button>
            </header>
            <main className="main">
                <div className="management-area">
                    <button
                        className="management-area__btn add-btn"
                        onClick={addTask}
                    >Добавить</button>
                    <input
                        className="management-area__input-task"
                        placeholder="Пополните список ..."
                        value={taskName}
                        onChange={(e): void => setTaskName(e.target.value)}
                        onKeyPress={(e): void => {
                            if (e.key === 'Enter') {
                                addTask();
                            }
                        }}
                    />
                    <button
                        className="management-area__btn remove-btn"
                        onClick={deleteAllTasks}
                    >Очистить список</button>
                </div>
                <div className="task-board">
                    <div className="task-board__tab">
                        <button
                            className={`task-board__tab__item ${activeBoard === 'current' ? 'active' : ''}`}
                            onClick={() => changeBoard('current')}
                        >Текущие дела</button>
                        <button
                            className={`task-board__tab__item ${activeBoard === 'all' ? 'active' : ''}`}
                            onClick={() => changeBoard('all')}
                        >Все дела</button>
                        <button
                            className={`task-board__tab__item ${activeBoard === 'completed' ? 'active' : ''}`}
                            onClick={() => changeBoard('completed')}
                        >Выполненные дела</button>
                        <button
                            className={`task-board__tab__item ${activeBoard === 'deleted' ? 'active' : ''}`}
                            onClick={() => changeBoard('deleted')}
                        >Корзина</button>
                    </div>
                    {
                        activeBoard === 'deleted'
                            ? <div className="task-board__clear-trash">
                                <button
                                    className="task-board__clear-trash__btn"
                                    onClick={clearTrash}
                                >Очистить Корзину
                                </button>
                            </div>
                            : null
                    }
                    <div>
                        {
                            filterTasks.map((task: Task) => (
                                <TaskComponent
                                    task={task}
                                    changeStatus={() => changeTaskStatus(task)}
                                    deleteTask={() => deletedTask(task)}
                                />
                            ))
                        }
                    </div>
                </div>
            </main>

        </div>
    )
}

export default HomePage