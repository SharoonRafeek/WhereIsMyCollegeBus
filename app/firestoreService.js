import { addDoc, collection, getDocs } from "firebase/firestore";
import { firestore } from "./firebaseConfig";

// Add a user to Firestore
export const addUser = async (name, age) => {
  try {
    await addDoc(collection(firestore, "users"), { name, age });
    console.log("User added!");
  } catch (error) {
    console.error("Error adding user:", error);
  }
};

// Fetch users from Firestore
export const fetchUsers = async () => {
  const querySnapshot = await getDocs(collection(firestore, "users"));
  let users = [];
  querySnapshot.forEach((doc) => {
    users.push({ id: doc.id, ...doc.data() });
  });
  return users;
};
