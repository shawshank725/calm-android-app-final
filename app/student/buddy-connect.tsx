import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { toByteArray } from 'base64-js';
import { ResizeMode, Video } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { supabase } from '../../lib/supabase';

const { width } = Dimensions.get('window');

interface Post {
  id: string;
  user_id: string;
  user_name: string;
  user_type: string;
  content: string;
  media_url?: string;
  media_type?: 'image' | 'video' | null;
  created_at: string;
  comments_count: number;
}

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  user_name: string;
  user_type: string;
  comment_text: string;
  created_at: string;
}

export default function BuddyConnect() {
  const router = useRouter();

  // User info
  const [studentName, setStudentName] = useState('');
  const [studentRegNo, setStudentRegNo] = useState('');

  // Posts
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Create Post
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<any>(null);
  const [uploading, setUploading] = useState(false);

  // Comments
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [postingComment, setPostingComment] = useState(false);

  useEffect(() => {
    loadUserInfo();
    loadPosts();
  }, []);

  const loadUserInfo = async () => {
    try {
      const name = await AsyncStorage.getItem('studentName');
      const regNo = await AsyncStorage.getItem('studentRegNo');
      if (name) setStudentName(name);
      if (regNo) setStudentRegNo(regNo);
    } catch (error) {
      console.error('Error loading user info:', error);
    }
  };

  const loadPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get comment counts for each post
      const postsWithCounts = await Promise.all(
        (data || []).map(async (post) => {
          const { count } = await supabase
            .from('post_comments')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', post.id);

          return { ...post, comments_count: count || 0 };
        })
      );

      setPosts(postsWithCounts);
    } catch (error) {
      console.error('Error loading posts:', error);
      Alert.alert('Error', 'Failed to load posts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadPosts();
  };

  const pickMedia = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'video/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];

        // Check file size (max 50MB)
        const maxSize = 50 * 1024 * 1024;
        if (file.size && file.size > maxSize) {
          Alert.alert('File Too Large', 'Please select a file smaller than 50MB');
          return;
        }

        setSelectedMedia(file);
      }
    } catch (error) {
      console.error('Error picking media:', error);
      Alert.alert('Error', 'Failed to select media');
    }
  };

  const uploadMediaToStorage = async (file: any): Promise<string | null> => {
    try {
      // Read file as base64
      const base64Data = await FileSystem.readAsStringAsync(file.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Convert to bytes
      const fileBytes = toByteArray(base64Data);

      // Create unique filename
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop() || 'file';
      const storagePath = `community/${studentRegNo}/${timestamp}.${fileExtension}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('resources')
        .upload(storagePath, fileBytes, {
          contentType: file.mimeType || 'application/octet-stream',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('resources')
        .getPublicUrl(storagePath);

      return urlData?.publicUrl || null;
    } catch (error) {
      console.error('Error uploading media:', error);
      throw error;
    }
  };

  const createPost = async () => {
    if (!postContent.trim() && !selectedMedia) {
      Alert.alert('Error', 'Please add some content or media');
      return;
    }

    try {
      setUploading(true);

      let mediaUrl = null;
      let mediaType = null;

      // Upload media if selected
      if (selectedMedia) {
        mediaUrl = await uploadMediaToStorage(selectedMedia);
        mediaType = selectedMedia.mimeType?.startsWith('video/') ? 'video' : 'image';
      }

      // Create post in database
      const { error } = await supabase
        .from('community_posts')
        .insert({
          user_id: studentRegNo,
          user_name: studentName,
          user_type: 'student',
          content: postContent,
          media_url: mediaUrl,
          media_type: mediaType,
          created_at: new Date().toISOString(),
        });

      if (error) throw error;

      Alert.alert('Success', 'Post created successfully!');
      setShowCreateModal(false);
      setPostContent('');
      setSelectedMedia(null);
      loadPosts();
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post');
    } finally {
      setUploading(false);
    }
  };

  const loadComments = async (postId: string) => {
    try {
      setLoadingComments(true);
      const { data, error } = await supabase
        .from('post_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error loading comments:', error);
      Alert.alert('Error', 'Failed to load comments');
    } finally {
      setLoadingComments(false);
    }
  };

  const openCommentsModal = (post: Post) => {
    setSelectedPost(post);
    setShowCommentsModal(true);
    loadComments(post.id);
  };

  const postComment = async () => {
    if (!commentText.trim() || !selectedPost) return;

    try {
      setPostingComment(true);

      const { error } = await supabase
        .from('post_comments')
        .insert({
          post_id: selectedPost.id,
          user_id: studentRegNo,
          user_name: studentName,
          user_type: 'student',
          comment_text: commentText,
          created_at: new Date().toISOString(),
        });

      if (error) throw error;

      setCommentText('');
      loadComments(selectedPost.id);

      // Update comment count in posts list
      setPosts(posts.map(p =>
        p.id === selectedPost.id
          ? { ...p, comments_count: p.comments_count + 1 }
          : p
      ));
    } catch (error) {
      console.error('Error posting comment:', error);
      Alert.alert('Error', 'Failed to post comment');
    } finally {
      setPostingComment(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const renderPost = ({ item }: { item: Post }) => (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>{item.user_name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.postHeaderInfo}>
          <Text style={styles.userName}>{item.user_name}</Text>
          <Text style={styles.postTime}>{formatTimeAgo(item.created_at)}</Text>
        </View>
      </View>

      {item.content ? (
        <Text style={styles.postContent}>{item.content}</Text>
      ) : null}

      {item.media_url && item.media_type === 'image' && (
        <Image
          source={{ uri: item.media_url }}
          style={styles.postImage}
          resizeMode="cover"
        />
      )}

      {item.media_url && item.media_type === 'video' && (
        <Video
          source={{ uri: item.media_url }}
          style={styles.postVideo}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
        />
      )}

      <View style={styles.postFooter}>
        <TouchableOpacity
          style={styles.commentButton}
          onPress={() => openCommentsModal(item)}
        >
          <Ionicons name="chatbubble-outline" size={20} color={Colors.primary} />
          <Text style={styles.commentButtonText}>
            {item.comments_count} {item.comments_count === 1 ? 'Comment' : 'Comments'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading community feed...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🌟 Buddy Connect</Text>
        <TouchableOpacity onPress={() => setShowCreateModal(true)}>
          <Ionicons name="add-circle" size={28} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Posts Feed */}
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.feedContainer}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyText}>No posts yet</Text>
            <Text style={styles.emptySubtext}>Be the first to share something!</Text>
          </View>
        }
      />

      {/* Create Post Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.createPostModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Post</Text>
              <TouchableOpacity onPress={() => {
                setShowCreateModal(false);
                setPostContent('');
                setSelectedMedia(null);
              }}>
                <Ionicons name="close" size={28} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <TextInput
                style={styles.postInput}
                placeholder="What's on your mind?"
                placeholderTextColor={Colors.textSecondary}
                value={postContent}
                onChangeText={setPostContent}
                multiline
                numberOfLines={4}
              />

              {selectedMedia && (
                <View style={styles.selectedMediaContainer}>
                  {selectedMedia.mimeType?.startsWith('image/') ? (
                    <Image
                      source={{ uri: selectedMedia.uri }}
                      style={styles.selectedMediaPreview}
                    />
                  ) : (
                    <View style={styles.videoPreviewContainer}>
                      <Ionicons name="videocam" size={50} color={Colors.primary} />
                      <Text style={styles.videoName}>{selectedMedia.name}</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.removeMediaButton}
                    onPress={() => setSelectedMedia(null)}
                  >
                    <Ionicons name="close-circle" size={30} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity
                style={styles.addMediaButton}
                onPress={pickMedia}
                disabled={uploading}
              >
                <Ionicons name="image" size={24} color={Colors.primary} />
                <Text style={styles.addMediaText}>Add Photo/Video</Text>
              </TouchableOpacity>
            </ScrollView>

            <TouchableOpacity
              style={[styles.postButton, uploading && styles.postButtonDisabled]}
              onPress={createPost}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.postButtonText}>Post</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Comments Modal */}
      <Modal
        visible={showCommentsModal}
        animationType="slide"
        transparent={true}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.commentsModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Comments</Text>
              <TouchableOpacity onPress={() => {
                setShowCommentsModal(false);
                setCommentText('');
                setComments([]);
              }}>
                <Ionicons name="close" size={28} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {loadingComments ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
              </View>
            ) : (
              <ScrollView style={styles.commentsContainer}>
                {comments.length === 0 ? (
                  <View style={styles.noCommentsContainer}>
                    <Text style={styles.noCommentsText}>No comments yet</Text>
                    <Text style={styles.noCommentsSubtext}>Be the first to comment!</Text>
                  </View>
                ) : (
                  comments.map((comment) => (
                    <View key={comment.id} style={styles.commentItem}>
                      <View style={styles.commentAvatar}>
                        <Text style={styles.commentAvatarText}>
                          {comment.user_name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.commentContent}>
                        <Text style={styles.commentUserName}>{comment.user_name}</Text>
                        <Text style={styles.commentText}>{comment.comment_text}</Text>
                        <Text style={styles.commentTime}>
                          {formatTimeAgo(comment.created_at)}
                        </Text>
                      </View>
                    </View>
                  ))
                )}
              </ScrollView>
            )}

            <View style={styles.commentInputContainer}>
              <TextInput
                style={styles.commentInput}
                placeholder="Write a comment..."
                placeholderTextColor={Colors.textSecondary}
                value={commentText}
                onChangeText={setCommentText}
                multiline
              />
              <TouchableOpacity
                style={[styles.sendButton, (!commentText.trim() || postingComment) && styles.sendButtonDisabled]}
                onPress={postComment}
                disabled={!commentText.trim() || postingComment}
              >
                {postingComment ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Ionicons name="send" size={20} color={Colors.white} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: Colors.textSecondary,
    fontSize: 16,
  },
  feedContainer: {
    padding: 16,
  },
  postCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  postHeaderInfo: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  postTime: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  postContent: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 250,
    borderRadius: 8,
    marginBottom: 12,
  },
  postVideo: {
    width: '100%',
    height: 250,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: Colors.black,
  },
  postFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  commentButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentButtonText: {
    marginLeft: 6,
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  createPostModal: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  modalContent: {
    padding: 20,
  },
  postInput: {
    fontSize: 16,
    color: Colors.text,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  selectedMediaContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  selectedMediaPreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  videoPreviewContainer: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: Colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoName: {
    marginTop: 8,
    fontSize: 14,
    color: Colors.text,
  },
  removeMediaButton: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  addMediaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  addMediaText: {
    marginLeft: 8,
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
  },
  postButton: {
    backgroundColor: Colors.primary,
    margin: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  postButtonDisabled: {
    opacity: 0.5,
  },
  postButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  commentsModal: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%',
  },
  commentsContainer: {
    flex: 1,
    padding: 20,
  },
  noCommentsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  noCommentsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  noCommentsSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentAvatarText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  commentContent: {
    flex: 1,
    marginLeft: 12,
    backgroundColor: Colors.backgroundLight,
    padding: 12,
    borderRadius: 12,
  },
  commentUserName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  commentText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 4,
  },
  commentTime: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.white,
  },
  commentInput: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.text,
    maxHeight: 100,
  },
  sendButton: {
    marginLeft: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
