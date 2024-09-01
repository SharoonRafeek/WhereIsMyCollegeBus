import { View, Text } from "react-native";
import { Link, Redirect } from "expo-router";

const HomePage = () => {
  return <Redirect href={"/home"} />;
};

export default HomePage;
