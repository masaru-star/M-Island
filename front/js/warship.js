// 火災or弾薬庫発火
export function checkAbnormalityOnDamage(warship, damage) {
    // 既に異常状態か、沈没している場合はスキップ
    if (warship.currentDurability <= 0 || warship.abnormality !== null) {
        return; 
    }
    let newAbnormality = null;
    if (warship.currentAmmo >= 1000 && Math.random() < 0.30) {
        newAbnormality = 'ammoFire'; 
    }
    if (newAbnormality === null && Math.random() < 0.10) {
        newAbnormality = 'fire';
    }
        if (newAbnormality !== null) {
        warship.abnormality = newAbnormality;
        if (newAbnormality === 'fire') {
            logAction(`軍艦 ${warship.name} に火災が発生しました！`);
        } else if (newAbnormality === 'ammoFire') {
            logAction(`軍艦 ${warship.name} の弾薬庫が発火しました！`);
        }
    }
}
// 通信障害or浸水
export function checkAbnormalityOnHit(target) {
    if (target.currentDurability <= 0 || target.abnormality !== null) {
        return;
    }
    
    let newAbnormality = null;
    if (target.currentDurability <= 50 && Math.random() < 0.05) {
        newAbnormality = 'flooding';
    }
    if (newAbnormality === null && target.isDispatched && Math.random() < 0.01) {
        newAbnormality = 'commFailure'; 
    }

    if (newAbnormality !== null) {
        target.abnormality = newAbnormality;
        if (newAbnormality === 'flooding') {
            logAction(`軍艦 ${target.name} に浸水が発生しました！`);
        } else if (newAbnormality === 'commFailure') {
            logAction(`軍艦 ${target.name} に通信障害が発生しました！`);
        }
    }
}
