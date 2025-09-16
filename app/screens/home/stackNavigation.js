import { createStackNavigator } from '@react-navigation/stack';
import ProfileScreen from './profile';
import LoginScreen from '../login';
import RegisterScreen from '../signup';
import { useAuth } from '../../providers/AuthContext';

const Stack = createStackNavigator();

const StackNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null; // o un componente de carga
  }

  return (
    <Stack.Navigator>
  
       {isAuthenticated ? (
               <Stack.Screen 
        name="Profile" 
        options={{ headerShown: false }} 
        component={ProfileScreen} 
      /> 
              ) : (
                <>
                  <Stack.Screen name="Login" component={LoginScreen}options={{ headerShown: false }}  />
                  <Stack.Screen name="Signup" component={RegisterScreen}options={{ headerShown: false }}  />
                </>
              )}
    </Stack.Navigator>
  );
};

export default StackNavigator;