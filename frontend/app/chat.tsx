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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, Layout } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { api } from './config/api.config';
import { ThemedText } from '@/components/themed-text';
import { COLORS, SHADOWS } from '../constants/theme';

interface Message {
    id: string;
    text: string;
    isUser: boolean;
    timestamp: Date;
}

export default function ChatScreen() {
    const router = useRouter();
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
            text: inputText,
            isUser: true,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMsg]);
        setInputText('');
        setIsLoading(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

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

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
            {/* Premium Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <MaterialCommunityIcons name="chevron-left" size={28} color={COLORS.text} />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <ThemedText style={styles.headerTitle}>AI Assistant</ThemedText>
                    <View style={styles.statusIndicator}>
                        <View style={styles.statusDot} />
                        <ThemedText style={styles.statusText}>Active Now</ThemedText>
                    </View>
                </View>
                <TouchableOpacity style={styles.moreButton}>
                    <MaterialCommunityIcons name="dots-vertical" size={24} color={COLORS.text} />
                </TouchableOpacity>
            </View>

            {/* Chat Area */}
            <ScrollView
                ref={scrollViewRef}
                style={styles.chatArea}
                contentContainerStyle={styles.chatContent}
                onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                showsVerticalScrollIndicator={false}
            >
                {messages.map((msg, index) => (
                    <Animated.View
                        key={msg.id}
                        entering={msg.isUser ? FadeInUp : FadeInDown}
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
            <View style={styles.inputOuterContainer}>
                <View style={styles.inputContainer}>
                    <TouchableOpacity style={styles.addButton}>
                        <MaterialCommunityIcons name="plus" size={24} color={COLORS.textLight} />
                    </TouchableOpacity>

                    <TextInput
                        style={styles.input}
                        placeholder="Type your message..."
                        placeholderTextColor={COLORS.textLight}
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                    />

                    <TouchableOpacity
                        style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
                        onPress={sendMessage}
                        disabled={!inputText.trim() || isLoading}
                    >
                        <LinearGradient
                            colors={!inputText.trim() ? ['#F1F5F9', '#F1F5F9'] : [COLORS.primary, COLORS.accent]}
                            style={styles.sendGradient}
                        >
                            <MaterialCommunityIcons
                                name="send"
                                size={20}
                                color={!inputText.trim() ? COLORS.textLight : "white"}
                            />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: Platform.OS === 'ios' ? 60 : 50,
        paddingBottom: 16,
        paddingHorizontal: 20,
        backgroundColor: COLORS.white,
        ...SHADOWS.small,
        zIndex: 10,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.surface,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitleContainer: {
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
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
        fontWeight: '600',
    },
    moreButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    chatArea: {
        flex: 1,
    },
    chatContent: {
        padding: 20,
        paddingBottom: 40,
    },
    messageWrapper: {
        flexDirection: 'row',
        marginBottom: 20,
        maxWidth: '85%',
    },
    userWrapper: {
        alignSelf: 'flex-end',
    },
    botWrapper: {
        alignSelf: 'flex-start',
    },
    avatarContainer: {
        marginRight: 10,
        alignSelf: 'flex-end',
    },
    avatarGradient: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    messageBubble: {
        padding: 16,
        borderRadius: 24,
        ...SHADOWS.small,
    },
    userBubble: {
        backgroundColor: COLORS.primary,
        borderBottomRightRadius: 4,
    },
    botBubble: {
        backgroundColor: COLORS.surface,
        borderBottomLeftRadius: 4,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 22,
    },
    userText: {
        color: COLORS.white,
        fontWeight: '500',
    },
    botText: {
        color: COLORS.text,
        fontWeight: '500',
    },
    timestamp: {
        fontSize: 10,
        marginTop: 6,
    },
    userTimestamp: {
        color: '#FECACA',
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
        paddingHorizontal: 20,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
        paddingTop: 10,
        backgroundColor: COLORS.white,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: 28,
        padding: 6,
        ...SHADOWS.small,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    addButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        maxHeight: 100,
        fontSize: 15,
        color: COLORS.text,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    sendButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        overflow: 'hidden',
    },
    sendGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        opacity: 0.8,
    },
});

