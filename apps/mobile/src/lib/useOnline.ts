import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { flushQueue, getQueue } from './queue';

export function useOnline() {
  const [online, setOnline] = useState(true); const [pending, setPending] = useState(0); const [note, setNote] = useState('');
  useEffect(() => {
    getQueue().then((q) => setPending(q.length));
    return NetInfo.addEventListener(async (s) => {
      const on = !!s.isConnected && s.isInternetReachable !== false; setOnline(on);
      if (on) { const r = await flushQueue(); if (r.synced || r.conflicts) setNote(`${r.synced} queued item(s) synchronised${r.conflicts ? `, ${r.conflicts} need review` : ''}`); }
      setPending((await getQueue()).length);
    });
  }, []);
  return { online, pending, note, refresh: async () => setPending((await getQueue()).length) };
}
