import { useEffect, useState } from "react";
import { storage } from "wxt/storage";

export default function StorageDisplay() {
  const [storageData, setStorageData] = useState<{
    userId?: string;
    username?: string;
  }>({});

  useEffect(() => {
    const loadStorage = async () => {
      const [userId, username] = await Promise.all([
        storage.getItem<string>("local:userId"),
        storage.getItem<string>("local:username"),
      ]);
      setStorageData({ userId, username });
    };

    loadStorage();

    const unwatchUserId = storage.watch("local:userId", (newValue) => {
      setStorageData((prev) => ({ ...prev, userId: newValue }));
    });

    const unwatchUsername = storage.watch("local:username", (newValue) => {
      setStorageData((prev) => ({ ...prev, username: newValue }));
    });

    return () => {
      unwatchUserId();
      unwatchUsername();
    };
  }, []);

  return (
    <div>
      <h3>Storage Contents:</h3>
      <pre>{JSON.stringify(storageData, null, 2)}</pre>
    </div>
  );
}
