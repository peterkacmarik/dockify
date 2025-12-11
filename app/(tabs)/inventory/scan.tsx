import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useRouter } from 'expo-router';
import { ArrowLeft, Barcode, Box, Check, Copy, Flashlight, AlertTriangle, Plus, RotateCcw, X } from 'lucide-react-native';
import React, { useCallback, useState, useRef } from 'react';
import {
    ActivityIndicator,
    Button,
    Dimensions,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../../src/contexts/ThemeContext';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCAN_FRAME_SIZE = SCREEN_WIDTH * 0.7;

// Valid mock EANs for testing: 123456
interface Product {
    name: string;
    sku: string;
    stock: number;
    unit: string;
    image?: string;
}

export default function ScanScreen() {
    const { colors } = useTheme();
    const router = useRouter();
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [flash, setFlash] = useState(false);
    const [scannedCode, setScannedCode] = useState<string | null>(null);
    const [foundProduct, setFoundProduct] = useState<Product | null>(null);
    const [scanState, setScanState] = useState<'idle' | 'found' | 'notFound'>('idle');
    const [isLoading, setIsLoading] = useState(false);

    // Camera is active only when screen is focused to save battery
    const [isActive, setIsActive] = useState(false);

    useFocusEffect(
        useCallback(() => {
            setIsActive(true);
            return () => {
                setIsActive(false);
                setFlash(false);
            };
        }, [])
    );

    if (!permission) {
        // Camera permissions are still loading.
        return <View style={[styles.container, { backgroundColor: colors.background }]} />;
    }

    if (!permission.granted) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
                <AlertTriangle size={64} color={colors.textSecondary} />
                <Text style={{ marginTop: 20, fontSize: 18, color: colors.text, textAlign: 'center' }}>
                    Pre skenovanie kódov potrebujeme prístup ku kamere.
                </Text>
                <TouchableOpacity
                    style={[styles.btnPrimary, { backgroundColor: colors.primary, marginTop: 20 }]}
                    onPress={requestPermission}
                >
                    <Text style={styles.btnText}>Povoliť kameru</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    const handleBarCodeScanned = async ({ data }: { data: string }) => {
        if (scanned || !isActive) return;

        setScanned(true);
        setScannedCode(data);
        setIsLoading(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Simulate API call
        setTimeout(() => {
            // Mock logic: If code ends with '0', product not found.
            // valid: 123456

            // Hardcoded valid product for testing
            if (data === '123456' || !data.endsWith('0')) {
                setFoundProduct({
                    name: "Bezdrôtové slúchadlá Sony WH-1000XM5",
                    sku: "SONY-WH-XM5-BLK",
                    stock: 124,
                    unit: "ks"
                });
                setScanState('found');
            } else {
                setFoundProduct(null);
                setScanState('notFound');
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            }
            setIsLoading(false);
        }, 600);
    };

    const resetScan = () => {
        setScanned(false);
        setScannedCode(null);
        setFoundProduct(null);
        setScanState('idle');
    };

    const toggleFlash = () => {
        setFlash(prev => !prev);
    };

    return (
        <View style={styles.container}>
            {isActive && (
                <CameraView
                    style={StyleSheet.absoluteFill}
                    facing="back"
                    enableTorch={flash}
                    onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                />
            )}

            {/* Dark Overlay with Transparent Cutout - Simulated using Views */}
            <View style={styles.overlayContainer}>
                <View style={styles.overlayTop} />
                <View style={styles.overlayMiddle}>
                    <View style={styles.overlaySide} />
                    <View style={styles.scanFrame}>
                        {/* Corner markers */}
                        <View style={[styles.corner, styles.tl, { borderColor: colors.primary }]} />
                        <View style={[styles.corner, styles.tr, { borderColor: colors.primary }]} />
                        <View style={[styles.corner, styles.bl, { borderColor: colors.primary }]} />
                        <View style={[styles.corner, styles.br, { borderColor: colors.primary }]} />

                        {/* Scanning Line Animation could go here */}
                        {isLoading && <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />}
                    </View>
                    <View style={styles.overlaySide} />
                </View>
                <View style={styles.overlayBottom} />
            </View>



            {/* Bottom Content Dynamic */}
            <View style={[styles.bottomSheet, { backgroundColor: colors.card }]}>
                {scanState === 'idle' && (
                    <View style={styles.idleState}>
                        <Text style={[styles.instructionText, { color: colors.text }]}>
                            Nasnímaj EAN alebo QR kód
                        </Text>
                        <Text style={[styles.instructionSub, { color: colors.textSecondary }]}>
                            Kód sa naskenuje automaticky
                        </Text>

                        <View style={styles.idleActions}>
                            <TouchableOpacity style={styles.actionBtn} onPress={toggleFlash}>
                                <View style={[styles.circleBtn, { backgroundColor: flash ? colors.primary : colors.border }]}>
                                    <Flashlight size={24} color={flash ? '#FFF' : colors.text} />
                                </View>
                                <Text style={[styles.actionLabel, { color: colors.text }]}>Svetlo</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.actionBtn} onPress={() => { /* Manual Entry */ }}>
                                <View style={[styles.circleBtn, { backgroundColor: colors.border }]}>
                                    <Barcode size={24} color={colors.text} />
                                </View>
                                <Text style={[styles.actionLabel, { color: colors.text }]}>Kód ručne</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {scanState === 'found' && foundProduct && (
                    <View style={styles.foundState}>
                        <View style={styles.productHeader}>
                            <View style={[styles.productIcon, { backgroundColor: colors.primary + '20' }]}>
                                <Box size={32} color={colors.primary} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.productName, { color: colors.text }]}>{foundProduct.name}</Text>
                                <Text style={[styles.productSku, { color: colors.textSecondary }]}>{foundProduct.sku}</Text>
                            </View>
                        </View>

                        <View style={[styles.stockInfo, { backgroundColor: colors.background }]}>
                            <View style={styles.stockItem}>
                                <Text style={[styles.stockLabel, { color: colors.textSecondary }]}>Skladom</Text>
                                <Text style={[styles.stockValue, { color: colors.text }]}>{foundProduct.stock} {foundProduct.unit}</Text>
                            </View>
                            <View style={styles.stockItem}>
                                <Text style={[styles.stockLabel, { color: colors.textSecondary }]}>Kód</Text>
                                <Text style={[styles.stockValue, { color: colors.text }]}>{scannedCode}</Text>
                            </View>
                        </View>

                        <View style={styles.actionRow}>
                            <TouchableOpacity style={[styles.mainActionBtn, { backgroundColor: '#4CAF50' }]}>
                                <Text style={styles.mainActionText}>PRÍJEM</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.mainActionBtn, { backgroundColor: '#F44336' }]}>
                                <Text style={styles.mainActionText}>VÝDAJ</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.mainActionBtn, { backgroundColor: '#FF9800' }]}>
                                <Text style={styles.mainActionText}>INVENTÚRA</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity onPress={resetScan} style={[styles.cancelBtn, { marginTop: 12 }]}>
                            <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Zrušiť / Skenovať ďalší</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {scanState === 'notFound' && (
                    <View style={styles.notFoundState}>
                        <View style={[styles.errorIcon, { backgroundColor: colors.error + '20' }]}>
                            <AlertTriangle size={40} color={colors.error} />
                        </View>
                        <Text style={[styles.errorTitle, { color: colors.text }]}>Produkt neexistuje</Text>
                        <Text style={[styles.errorSub, { color: colors.textSecondary }]}>
                            Kód: <Text style={{ fontWeight: 'bold', fontFamily: Platform.select({ ios: 'Courier', android: 'monospace' }) }}>{scannedCode}</Text> sa v databáze nenašiel.
                        </Text>

                        <View style={styles.actionRow}>
                            <TouchableOpacity style={[styles.secondaryBtn, { borderColor: colors.border }]} onPress={resetScan}>
                                <RotateCcw size={20} color={colors.text} style={{ marginRight: 8 }} />
                                <Text style={[styles.secondaryBtnText, { color: colors.text }]}>Skúsiť znova</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.primary }]}>
                                <Plus size={20} color="#FFF" style={{ marginRight: 8 }} />
                                <Text style={styles.primaryBtnText}>Vytvoriť produkt</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },

    // Overlay logic
    overlayContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    overlayTop: {
        flex: 0.2,
        width: '100%',
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    overlayMiddle: {
        flexDirection: 'row',
        height: SCAN_FRAME_SIZE,
    },
    overlaySide: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    scanFrame: {
        width: SCAN_FRAME_SIZE,
        height: SCAN_FRAME_SIZE,
        backgroundColor: 'transparent',
        position: 'relative',
    },
    overlayBottom: {
        flex: 1.5, // More specific weight to push frame slightly up
        width: '100%',
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    // Frame Corners
    corner: {
        position: 'absolute',
        width: 30,
        height: 30,
        borderWidth: 4,
        borderColor: '#FFF',
    },
    tl: { top: 0, left: 0, borderBottomWidth: 0, borderRightWidth: 0 },
    tr: { top: 0, right: 0, borderBottomWidth: 0, borderLeftWidth: 0 },
    bl: { bottom: 0, left: 0, borderTopWidth: 0, borderRightWidth: 0 },
    br: { bottom: 0, right: 0, borderTopWidth: 0, borderLeftWidth: 0 },

    // Bottom Sheet
    bottomSheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        minHeight: 250,
        paddingBottom: 40,
    },
    // Idle State
    idleState: {
        alignItems: 'center',
    },
    instructionText: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 8,
    },
    instructionSub: {
        fontSize: 14,
        marginBottom: 24,
    },
    idleActions: {
        flexDirection: 'row',
        gap: 32,
    },
    actionBtn: {
        alignItems: 'center',
        gap: 8,
    },
    circleBtn: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionLabel: {
        fontSize: 12,
        fontWeight: '500',
    },

    // Found State
    foundState: {
        gap: 16,
    },
    productHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    productIcon: {
        width: 56,
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    productName: {
        fontSize: 18,
        fontWeight: '700',
    },
    productSku: {
        fontSize: 14,
    },
    stockInfo: {
        flexDirection: 'row',
        borderRadius: 12,
        padding: 12,
    },
    stockItem: {
        flex: 1,
        alignItems: 'center',
    },
    stockLabel: {
        fontSize: 12,
        marginBottom: 4,
    },
    stockValue: {
        fontSize: 16,
        fontWeight: '600',
    },
    actionRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 8,
    },
    mainActionBtn: {
        flex: 1,
        height: 44,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mainActionText: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 12,
    },
    cancelBtn: {
        alignItems: 'center',
        padding: 8,
    },
    cancelText: {

    },

    // Not Found State
    notFoundState: {
        alignItems: 'center',
        gap: 12,
    },
    errorIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    errorSub: {
        textAlign: 'center',
        fontSize: 14,
        maxWidth: '80%',
    },
    primaryBtn: {
        flex: 1,
        flexDirection: 'row',
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    primaryBtnText: {
        color: '#FFF',
        fontWeight: '600',
        fontSize: 16,
    },
    secondaryBtn: {
        flex: 1,
        flexDirection: 'row',
        height: 48,
        borderRadius: 12,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    secondaryBtnText: {
        fontWeight: '600',
        fontSize: 16,
    },
    btnPrimary: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    btnText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});
