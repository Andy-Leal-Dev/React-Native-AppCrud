import { createStackNavigator } from '@react-navigation/stack';
import ProfileScreen from './profile';
import LoginScreen from '../login';
import RegisterScreen from '../signup';

const Stack = createStackNavigator();

const StackNavigator = () => {
      return (
    <Stack.Navigator initialRouteName="Login">
      <Stack.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="Login" 
        component={LoginScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="Signup" 
        component={RegisterScreen} 
        options={{ headerShown: false }} 
      />
    </Stack.Navigator>
  );
};

export default StackNavigator;