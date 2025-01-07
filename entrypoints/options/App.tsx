import StorageDisplay from "@/components/StorageDisplay";
import { storage } from "wxt/storage";
import { useState } from "react";

function App() {
  const [username, setUsername] = useState("");

  const handleSave = async () => {
    const uuid = crypto.randomUUID();
    await Promise.all([
      storage.setItem("local:userId", uuid),
      storage.setItem("local:username", username),
    ]);
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          padding: "2rem",
        }}
      >
        <h1>Welcome to Nectar</h1>
        <div>
          <input
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{
              padding: "0.5rem",
              borderRadius: "4px",
              border: "1px solid #646cff",
              background: "#1a1a1a",
              color: "white",
              width: "100%",
              maxWidth: "300px",
              marginBottom: "1rem",
            }}
          />
          <button
            onClick={handleSave}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "4px",
              border: "1px solid #646cff",
              background: "#646cff",
              color: "white",
              cursor: "pointer",
            }}
          >
            Save
          </button>
        </div>

        <StorageDisplay />
      </div>
    </>
  );
}

export default App;
