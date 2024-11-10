import '../Styles/Task.css'
import deleteLogo from '../assets/icons/delete.svg'
import completedLogo from '../assets/icons/completed.svg'
import returnLogo from '../assets/icons/return.svg'
import undeleteLogo from '../assets/icons/undelete.svg'


interface Task {
    id: string;
    name: string;
    status: string;
}
interface TaskProps {
    task: Task
    changeStatus: (task: Task) => void;
    deleteTask: (task: Task) => void;
}

const Task = ({task, changeStatus, deleteTask}: TaskProps, ) => {
    let completedIcon
    let deletedIcon
    if (task.status === 'current') {
        completedIcon = completedLogo
    } else if (task.status === 'completed') {
        completedIcon = returnLogo
    }
    if (task.status !== 'deleted') {
        deletedIcon = deleteLogo
    } else {
        deletedIcon = undeleteLogo
    }


    return (
        <div className="task">
            <span className="task__title">{task.name}</span>
            <div className="task__buttons">
                {
                    task.status !== 'deleted'
                        ? <img
                            src={completedIcon}
                            alt="Completed logo"
                            className="task__buttons__change"
                            onClick={() => changeStatus(task)}
                            />
                        : null
                }
                <img
                    src={deletedIcon}
                    alt="Delete logo"
                    className="ask__buttons__delete"
                    onClick={() => deleteTask(task)}
                />
            </div>
        </div>
    )
}

export default Task