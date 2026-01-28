// src/services/BackgroundSync.js
import BackgroundFetch from 'react-native-background-fetch';
import PaymentService from './PaymentService';

const BackgroundSync = {
  configure() {
    BackgroundFetch.configure({
      minimumFetchInterval: 15, // minutes
    }, async (taskId) => {
      console.log('[BackgroundFetch] task:', taskId);
      await PaymentService.syncOfflineQueue();
      BackgroundFetch.finish(taskId);
    }, (error) => {
      console.warn('[BackgroundFetch] failed to start', error);
    });
  }
};

export default BackgroundSync;
