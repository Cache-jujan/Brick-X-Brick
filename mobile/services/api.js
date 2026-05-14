import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
 
const client = axios.create({
  baseURL: '192.168.100.4',  // ← replace with your computer IP
});
 
client.interceptors.request.use(async config => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
 
export default client;
