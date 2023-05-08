import React, { useState } from "react";
import {
  View,
  TextInput,
  Button,
  Image,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { firebase } from "../config";

const AddNote = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUri, setImageUri] = useState(null);

  const handleChooseImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission denied",
        "You need to grant permission to access the image library."
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.cancelled) {
      setImageUri(result.uri);
    }
  };

  const handleRemoveImage = () => {
    setImageUri(null);
  };

  const handleAddNote = () => {
    const db = firebase.firestore();
    const storageRef = firebase.storage().ref();
    const note = {
      title: title,
      content: content,
      imageUri: imageUri,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    };

    db.collection("notes")
      .add(note)
      .then(() => {
        setTitle("");
        setContent("");
        setImageUri(null);

        Alert.alert("Note added successfully!");
      })
      .catch((error) => {
        Alert.alert("Error", `Failed to add note: ${error.message}`);
      });
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={85}
      >
        <View style={styles.container}>
          <TextInput
            style={styles.inputTitle}
            placeholder="Enter note title"
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            style={styles.inputNote}
            placeholder="Enter note content"
            value={content}
            onChangeText={setContent}
            multiline
          />

          {imageUri && (
            <View>
              <Image source={{ uri: imageUri }} style={styles.image} />
              <View style={styles.buttonContainer}>
                <Button
                  title="Change Image"
                  onPress={handleChooseImage}
                  style={styles.button}
                  color="#D3D3D3"
                />
                <Button
                  title="Remove Image"
                  onPress={handleRemoveImage}
                  style={styles.button}
                  color="#D3D3D3"
                />
              </View>
            </View>
          )}

          <Button
            title="Choose Image"
            onPress={handleChooseImage}
            style={styles.button}
            color="#666"
          />

          <Button
            title="Add Note"
            onPress={handleAddNote}
            style={styles.button}
            color="#666"
          />
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#333",
  },
  inputTitle: {
    marginBottom: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 4,
    height: 40,
    backgroundColor: "white",
    color: "black",
  },
  inputNote: {
    marginBottom: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 4,
    minHeight: 80,
    backgroundColor: "white",
    color: "black",
  },
  image: {
    width: 200,
    height: 200,
    marginBottom: 16,
    borderRadius: 8,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    marginBottom: 5,
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },
});
export default AddNote;
