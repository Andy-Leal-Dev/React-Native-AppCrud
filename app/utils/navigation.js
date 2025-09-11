
import { NavigationContainer } from "@react-navigation/native";
import HomeTabNavigator from "../screens/home/tabNavigator";
import LoginScreen from "../screens/login";
import RegisterScreen from "../screens/signup";
import { createStackNavigator } from "@react-navigation/stack";
const Stack = createStackNavigator();

export default function Navigation() {
    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName="Login">
                <Stack.Screen 
                    name="Login" 
                    component={LoginScreen} 
                    options={{ headerShown: false }} 
                />
                <Stack.Screen 
                    name="Register" 
                    component={RegisterScreen} 
                    options={{ headerShown: false }} 
                />
                <Stack.Screen 
                    name="Home" 
                    component={HomeTabNavigator} 
                    options={{ headerShown: false }} 
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
}