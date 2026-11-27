
import { put } from '@vercel/blob';
import { randomUUID } from 'node:crypto';

export default async function handler(req, res) {
    console.log('[SHARE API VERSION 4]');
    
    // 1. POST 요청만 허용
    if (req.method !== 'POST') {
        return res.status(405).json({
            error: 'POST only'
        });
    }

    // 2. QR 공유 기능 활성화 확인
    if (process.env.ENABLE_PUBLIC_SHARE !== 'true') {
        return res.status(403).json({
            error: '공유 기능이 비활성화되어 있습니다.'
        });
    }

    try {

        // 3. 인증 정보 선언
        const storeId = process.env.BLOB_STORE_ID;

        const oidcToken =
            req.headers['x-vercel-oidc-token'] ||
            process.env.VERCEL_OIDC_TOKEN;

        // 4. 인증 정보 확인
        console.log('[Blob Auth Debug]', {
            storeIdExists: !!storeId,
            oidcTokenExists: !!oidcToken,
            readWriteTokenExists:
                !!process.env.BLOB_READ_WRITE_TOKEN
        });

        if (!storeId) {
            throw new Error('BLOB_STORE_ID not found');
        }

        if (!oidcToken) {
            throw new Error('OIDC token not found');
        }

        // 5. 이미지 수신
        const image = req.body?.image;

        if (
            typeof image !== 'string' ||
            !image.startsWith('data:image/jpeg;base64,')
        ) {
            return res.status(400).json({
                error: 'JPEG 이미지가 필요합니다.'
            });
        }

        // 6. Base64 이미지 변환
        const bytes = Buffer.from(
            image.split(',')[1],
            'base64'
        );

        // 7. 이미지 유효성 검사
        if (
            bytes.length > 2 * 1024 * 1024 ||
            bytes[0] !== 255 ||
            bytes[1] !== 216
        ) {
            return res.status(400).json({
                error: 'JPEG 이미지는 최대 2MB까지 가능합니다.'
            });
        }

        // 8. 고유 파일명 생성
        const filename = `photos/${randomUUID()}.jpg`;

        // 9. Vercel Blob 이미지 저장
        const blob = await put(filename, bytes, {
            access: 'public',
            contentType: 'image/jpeg',
            addRandomSuffix: true
        });

        console.log('[Blob] 이미지 업로드 성공');

        // 10. 공유 URL 반환
        return res.status(200).json({
            url: blob.url
        });

    } catch (e) {

        console.error('[Blob upload error]', e);

        return res.status(500).json({
            error: '이미지 저장 실패'
        });
    }
}
