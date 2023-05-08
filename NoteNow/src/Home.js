import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  Modal,
  StyleSheet,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import { firebase } from "../config";

export default function Home() {
  const navigation = useNavigation();
  const [notes, setNotes] = useState([]);
  const [sortBy, setSortBy] = useState("alphabetical");
  const [selectedNote, setSelectedNote] = useState(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedNote, setEditedNote] = useState({});
  const [isNotePressDisabled, setIsNotePressDisabled] = useState(false);
  const [alphabeticalSortOrder, setAlphabeticalSortOrder] = useState("asc");
  const [createdAtSortOrder, setCreatedAtSortOrder] = useState("desc");

  useEffect(() => {
    const db = firebase.firestore();

    const unsubscribe = db.collection("notes").onSnapshot((snapshot) => {
      const updatedNotes = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setNotes(updatedNotes);
    });

    return () => unsubscribe();
  }, []);

  const handleSortByAlphabetical = () => {
    setAlphabeticalSortOrder((prevSortOrder) =>
      prevSortOrder === "asc" ? "desc" : "asc"
    );
  };

  const handleSortByCreatedAt = () => {
    setCreatedAtSortOrder((prevSortOrder) =>
      prevSortOrder === "asc" ? "desc" : "asc"
    );
  };

  const handleEditNote = (note) => {
    setIsEditing(true);
    setModalVisible(false);
    setEditedNote({ ...note });
  };

  const handleSaveNote = () => {
    // Tallenna muokattu muistiinpano tietokantaan
    const db = firebase.firestore();
    db.collection("notes")
      .doc(editedNote.id)
      .update(editedNote)
      .then(() => {
        setIsEditing(false);
        setEditedNote({});
      })
      .catch((error) => {
        console.log("Error updating note:", error);
      });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedNote({});
  };

  const handleDeleteNote = (note) => {
    // Poista muistiinpano tietokannasta
    const db = firebase.firestore();
    db.collection("notes")
      .doc(note.id)
      .delete()
      .catch((error) => {
        console.log("Error deleting note:", error);
      });
  };

  const handleNotePress = (item) => {
    // Estä toiminta, kun isNotePressDisabled tai isEditing on true
    if (isNotePressDisabled || isEditing) {
      return;
    }
    setSelectedNote(item);
    setModalVisible(true);
  };

  const handleImagePress = () => {
    setModalVisible(true);
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setIsEditing(false);
    setEditedNote({});
  };

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
      setEditedNote({ ...editedNote, imageUri: result.uri });
    }
  };

  const renderModalContent = () => (
    <View style={styles.modalContent}>
      {selectedNote && (
        <React.Fragment>
          {isEditing ? (
            <React.Fragment>
              <TextInput
                style={styles.editInput}
                value={editedNote.title}
                onChangeText={(text) =>
                  setEditedNote({ ...editedNote, title: text })
                }
              />
              <TextInput
                style={styles.editInput}
                value={editedNote.content}
                onChangeText={(text) =>
                  setEditedNote({ editedNote, content: text })
                }
              />
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveNote}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelEdit}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </React.Fragment>
          ) : (
            <React.Fragment>
              <Text style={styles.modalTitle}>{selectedNote.title}</Text>
              <Text style={styles.modalContentText}>
                {selectedNote.content}
              </Text>
              {selectedNote.imageUri && (
                <TouchableOpacity onPress={handleImagePress}>
                  <Image
                    source={{ uri: selectedNote.imageUri }}
                    style={styles.modalImage}
                  />
                </TouchableOpacity>
              )}
            </React.Fragment>
          )}
        </React.Fragment>
      )}
      <Pressable style={styles.modalCloseButton} onPress={handleModalClose}>
        <Text style={styles.modalCloseButtonText}>Close</Text>
      </Pressable>
    </View>
  );

  const sortedNotes = [...notes]; // Tee kopio muistiinpanoista
  if (sortBy === "alphabetical") {
    sortedNotes.sort((a, b) =>
      alphabeticalSortOrder === "asc"
        ? a.title.localeCompare(b.title)
        : b.title.localeCompare(a.title)
    );
  } else if (sortBy === "createdAt") {
    sortedNotes.sort((a, b) => {
      const compareResult = a.createdAt.toMillis() - b.createdAt.toMillis();
      return createdAtSortOrder === "asc" ? compareResult : -compareResult;
    });
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoidingContainer}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={85}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Muistiinpanot</Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={handleSortByAlphabetical}
          >
            <Text style={styles.buttonText}>Sort Alphabetically</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={handleSortByCreatedAt}
          >
            <Text style={styles.buttonText}>Sort by Created At</Text>
          </TouchableOpacity>
        </View>
        {sortedNotes.length > 0 ? (
          <FlatList
            data={sortedNotes}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.note}
                onPress={() => handleNotePress(item)}
              >
                <ScrollView>
                  <View>
                    <Text style={styles.noteTitle}>{item.title}</Text>
                    <Text style={styles.noteContent}>{item.content}</Text>
                  </View>
                </ScrollView>
                {item.imageUri && (
                  <TouchableOpacity onPress={handleImagePress}>
                    <Image
                      source={{ uri: item.imageUri }}
                      style={styles.noteImage}
                    />
                  </TouchableOpacity>
                )}
                {!isEditing && (
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => handleEditNote(item)}
                  >
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>
                )}
                {!isEditing && (
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteNote(item)}
                  >
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            )}
          />
        ) : (
          <Text>No notes found</Text>
        )}
        <Modal visible={isModalVisible} animationType="fade" transparent={true}>
          <View style={styles.modalContainer}>
            <View style={styles.modalWrapper}>{renderModalContent()}</View>
          </View>
        </Modal>

        {isEditing && (
          <View style={styles.editContainer}>
            <View style={styles.editInputContainer}>
              <TextInput
                style={styles.editInput}
                value={editedNote.title}
                onChangeText={(text) =>
                  setEditedNote({ ...editedNote, title: text })
                }
                multiline={true}
                numberOfLines={2}
              />
            </View>

            <View style={styles.editInputContainer}>
              <TextInput
                style={styles.editInput}
                value={editedNote.content}
                onChangeText={(text) =>
                  setEditedNote({ ...editedNote, content: text })
                }
                multiline={true}
                numberOfLines={4}
              />
            </View>

            {editedNote.imageUri && (
              <Image
                source={{ uri: editedNote.imageUri }}
                style={styles.editImage}
              />
            )}

            <View style={styles.imageButtonContainer}>
              <TouchableOpacity
                style={styles.changeImageButton}
                onPress={handleChooseImage}
              >
                <Text style={styles.changeImageButtonText}>Change Image</Text>
              </TouchableOpacity>

              {editedNote.imageUri && (
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() =>
                    setEditedNote({ ...editedNote, imageUri: null })
                  }
                >
                  <Text style={styles.removeImageButtonText}>Remove Image</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.saveCancelButtonContainer}>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveNote}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelEdit}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#333",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    color: "white",
    backgroundColor: "#333",
    padding: 8,
    borderRadius: 4,
  },
  note: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    backgroundColor: "#555",
    padding: 8,
    borderRadius: 4,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
  },
  noteContent: {
    fontSize: 14,
    color: "white",
  },
  noteImage: {
    marginLeft: 10,
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    marginBottom: 5,
    flexWrap: "wrap",
  },
  button: {
    marginRight: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#666",
    borderRadius: 4,
  },
  saveCancelButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly",
  },
  imageButtonContainer: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-evenly",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
  editButton: {
    marginLeft: "auto",
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#D3D3D3",
    borderRadius: 4,
  },
  editButtonText: {
    color: "black",
    fontWeight: "bold",
  },
  deleteButton: {
    marginLeft: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "red",
    borderRadius: 4,
  },
  deleteButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalWrapper: {
    backgroundColor: "white",
    padding: 24,
    borderRadius: 8,
    alignItems: "center",
    width: "80%",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  modalContentText: {
    fontSize: 16,
    marginBottom: 16,
  },
  modalImage: {
    width: 200,
    height: 200,
    marginBottom: 16,
    borderRadius: 8,
  },
  modalCloseButton: {
    marginTop: 16,
    padding: 8,
  },
  modalCloseButtonText: {
    fontSize: 16,
    color: "gray",
    fontWeight: "bold",
  },
  editContainer: {
    marginTop: 16,
  },
  editInput: {
    flex: 1,
    marginBottom: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 4,
    minHeight: 50,
    backgroundColor: "white",
  },

  editInputContainer: {
    marginBottom: 8,
    marginTop: 4,
    padding: 8,
    borderRadius: 4,
  },
  saveButton: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "green",
    borderRadius: 4,
  },
  saveButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  cancelButton: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "gray",
    borderRadius: 4,
    marginLeft: 5,
  },
  cancelButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  changeImageButton: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#D3D3D3",
    borderRadius: 4,
  },
  changeImageButtonText: {
    color: "black",
    fontWeight: "bold",
  },
  removeImageButton: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#D3D3D3",
    borderRadius: 4,
  },
  removeImageButtonText: {
    color: "black",
    fontWeight: "bold",
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },
});
