import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useRef, useState, useEffect } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
    Dimensions,
    Keyboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, Layout } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { api } from './config/api.config';
import { ThemedText } from '@/components/themed-text';
import { COLORS, SHADOWS, FONTS } from '../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

interface Message {
    id: string;
    text: string;
    isUser: boolean;
    timestamp: Date;
}

export default function ChatScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: "Hello! I'm your AI Medical Assistant. I'm here to help you understand symptoms or find medical information. How can I help you today?",
            isUser: false,
            timestamp: new Date(),
        },
    ]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);

    const sendMessage = async () => {
        if (!inputText.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            text: inputText.trim(),
            isUser: true,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMsg]);
        setInputText('');
        setIsLoading(true);

        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }

        try {
            const response = await api.chatWithBot(userMsg.text);
            const botMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: response.reply,
                isUser: false,
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, botMsg]);
        } catch (error) {
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: "I'm having trouble connecting to the network. Please try again in a moment.",
                isUser: false,
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: any) => {
        if (Platform.OS === 'web' && e.nativeEvent.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <View style={[styles.mainContainer, { paddingTop: insets.top }]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.container}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <View style={styles.responsiveWrapper}>
                    {/* Premium Header */}
                    <View style={styles.header}>
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={styles.backButton}
                            activeOpacity={0.7}
                        >
                            <MaterialCommunityIcons name="chevron-left" size={28} color={COLORS.text} />
                        </TouchableOpacity>
                        <View style={styles.headerTitleContainer}>
                            <ThemedText style={styles.headerTitle}>AI Assistant</ThemedText>
                            <View style={styles.statusIndicator}>
                                <View style={styles.statusDot} />
                                <ThemedText style={styles.statusText}>Active Now</ThemedText>
                            </View>
                        </View>
                        <View style={{ width: 44 }} />
                    </View>

                    {/* Chat Area */}
                    <ScrollView
                        ref={scrollViewRef}
                        style={styles.chatArea}
                        contentContainerStyle={styles.chatContent}
                        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                        showsVerticalScrollIndicator={Platform.OS === 'web'}
                    >
                        {messages.map((msg, index) => (
                            <Animated.View
                                key={msg.id}
                                entering={msg.isUser ? FadeInUp.duration(300) : FadeInDown.duration(300)}
                                layout={Layout.springify()}
                                style={[
                                    styles.messageWrapper,
                                    msg.isUser ? styles.userWrapper : styles.botWrapper,
                                ]}
                            >
                                {!msg.isUser && (
                                    <View style={styles.avatarContainer}>
                                        <LinearGradient
                                            colors={[COLORS.primary, COLORS.accent]}
                                            style={styles.avatarGradient}
                                        >
                                            <MaterialCommunityIcons name="robot" size={16} color="white" />
                                        </LinearGradient>
                                    </View>
                                )}
                                <View
                                    style={[
                                        styles.messageBubble,
                                        msg.isUser ? styles.userBubble : styles.botBubble,
                                    ]}
                                >
                                    <ThemedText
                                        style={[
                                            styles.messageText,
                                            msg.isUser ? styles.userText : styles.botText,
                                        ]}
                                    >
                                        {msg.text}
                                    </ThemedText>
                                    <ThemedText style={[styles.timestamp, msg.isUser ? styles.userTimestamp : styles.botTimestamp]}>
                                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </ThemedText>
                                </View>
                            </Animated.View>
                        ))}

                        {isLoading && (
                            <View style={styles.botWrapper}>
                                <View style={styles.avatarContainer}>
                                    <LinearGradient
                                        colors={[COLORS.primary, COLORS.accent]}
                                        style={styles.avatarGradient}
                                    >
                                        <MaterialCommunityIcons name="robot" size={16} color="white" />
                                    </LinearGradient>
                                </View>
                                <View style={[styles.messageBubble, styles.botBubble, styles.typingBubble]}>
                                    <ActivityIndicator size="small" color={COLORS.primary} />
                                </View>
                            </View>
                        )}
                    </ScrollView>

                    {/* Premium Input Area */}
                    <View style={[styles.inputOuterContainer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="Type your message..."
                                placeholderTextColor={COLORS.textLight}
                                value={inputText}
                                onChangeText={setInputText}
                                onKeyPress={handleKeyPress}
                                multiline
                                maxHeight={120}
                            />

                            <TouchableOpacity
                                style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
                                onPress={sendMessage}
                                disabled={!inputText.trim() || isLoading}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={!inputText.trim() ? ['#F1F5F9', '#F1F5F9'] : [COLORS.primary, COLORS.accent]}
                                    style={styles.sendGradient}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator size="small" color="white" />
                                    ) : (
                                        <MaterialCommunityIcons
                                            name="send"
                                            size={20}
                                            color={!inputText.trim() ? COLORS.textLight : "white"}
                                        />
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
        alignItems: 'center',
    },
    responsiveWrapper: {
        flex: 1,
        width: '100%',
        maxWidth: 800,
        backgroundColor: COLORS.white,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        height: 64,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitleContainer: {
        flex: 1,
        alignItems: 'center',
        marginRight: 44, // Offset the back button to center title correctly
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: FONTS.bold,
        color: COLORS.text,
    },
    statusIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.success,
        marginRight: 6,
    },
    statusText: {
        fontSize: 12,
        color: COLORS.textLight,
        fontFamily: FONTS.medium,
    },
    chatArea: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    chatContent: {
        padding: 16,
        paddingBottom: 32,
    },
    messageWrapper: {
        marginBottom: 16,
        width: '100%',
    },
    userWrapper: {
        alignItems: 'flex-end',
    },
    botWrapper: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'flex-start',
    },
    avatarContainer: {
        marginRight: 8,
        marginBottom: 4,
    },
    avatarGradient: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    messageBubble: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        maxWidth: '85%',
    },
    userBubble: {
        backgroundColor: COLORS.primary,
        borderBottomRightRadius: 4,
        ...SHADOWS.small,
    },
    botBubble: {
        backgroundColor: COLORS.white,
        borderBottomLeftRadius: 4,
        ...SHADOWS.small,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 22,
        fontFamily: FONTS.regular,
    },
    userText: {
        color: COLORS.white,
    },
    botText: {
        color: COLORS.text,
    },
    timestamp: {
        fontSize: 10,
        marginTop: 4,
        fontFamily: FONTS.regular,
    },
    userTimestamp: {
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'right',
    },
    botTimestamp: {
        color: COLORS.textLight,
        textAlign: 'left',
    },
    typingBubble: {
        width: 60,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
    },
    inputOuterContainer: {
        paddingHorizontal: 16,
        paddingTop: 12,
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        borderRadius: 24,
        padding: 4,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: COLORS.text,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontFamily: FONTS.regular,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        overflow: 'hidden',
        margin: 2,
    },
    sendGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        opacity: 0.5,
    },
});

