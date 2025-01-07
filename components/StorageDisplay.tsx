import { useEffect, useState } from "react";

export default function StorageDisplay() {
  const [storageData, setStorageData] = useState<{
    userId?: string;
    username?: string;
  }>({});

  useEffect(() => {
    const loadStorage = async () => {
      const data = await browser.storage.local.get(["userId", "username"]);
      setStorageData(data);
    };

    loadStorage();
  }, []);

  return (
    <div>
      <h3>Storage Contents:</h3>
      <pre>{JSON.stringify(storageData, null, 2)}</pre>
    </div>
  );
}
