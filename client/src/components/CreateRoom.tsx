import '../css/CreateRoom.css';

export default function CreateRoom() {
    const handleCreateRoom = (e: any) => {
        console.log(e);
    };
    return (
        <div>
            <span>Create Room</span>
            <button onClick={handleCreateRoom}>Create Room</button>
        </div>
    )
};

