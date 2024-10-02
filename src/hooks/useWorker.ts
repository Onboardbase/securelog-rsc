import { useEffect, useRef } from "react";

export const useWorker = (workerUrl: URL) => {
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    workerRef.current = new Worker(workerUrl);
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, [workerUrl]);

  const runWorker = (data: any): Promise<any> => {
    return new Promise((resolve) => {
      if (!workerRef.current) return;

      workerRef.current.onmessage = (e) => resolve(e.data);

      workerRef.current.postMessage(data);
    });
  };

  return { runWorker };
};
