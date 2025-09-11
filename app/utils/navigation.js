
import { NavigationContainer } from "@react-navigation/native";
import HomeTabNavigator from "../screens/home/tabNavigator";
import LoginScreen from "../screens/login";
import RegisterScreen from "../screens/signup";
import { createStackNavigator } from "@react-navigation/stack";
const Stack = createStackNavigator();

export default function Navigation() {
    return (
        <NavigationContainer>
           <HomeTabNavigator />
        </NavigationContainer>
    );
}