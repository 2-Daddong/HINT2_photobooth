import { put } from '@vercel/blob';
import { randomUUID } from 'node:crypto';

export default async function handler(req, res) {

    // 1. POST 요청만 허용
    if (req.method !== 'POST') {
        return res.status(405).json({
            error: 'POST only'
        });
    }

    // 2. QR 공유 기능 활성화 여부 확인
    if (process.env.ENABLE_PUBLIC_SHARE !== 'true') {
        return res.status(403).json({
            error: '공유 기능이 비활성화되어 있습니다.'
        });
    }

    try {

        // 3. 최종 합성 이미지 수신
        const image = req.body?.image;

        if (
            typeof image !== 'string' ||
            !image.startsWith('data:image/jpeg;base64,')
        ) {
            return res.status(400).json({
                error: 'JPEG 이미지가 필요합니다.'
            });
        }

        // 4. Base64 이미지를 Buffer로 변환
        const bytes = Buffer.from(
            image.split(',')[1],
            'base64'
        );

        // 5. 이미지 형식 및 용량 확인
        if (
            bytes.length > 2 * 1024 * 1024 ||
            bytes[0] !== 255 ||
            bytes[1] !== 216
        ) {
            return res.status(400).json({
                error: 'JPEG 이미지는 최대 2MB까지 가능합니다.'
            });
        }

        // 6. 고유 파일명 생성
        const filename = `photos/${randomUUID()}.jpg`;

        // 7. Vercel Blob 저장
        // OIDC 인증 자동 적용
        const blob = await put(filename, bytes, {
            access: 'public',
            contentType: 'image/jpeg',
            addRandomSuffix: true,
            storeId: storeId,
            oidcToken: oidcToken
        });

        console.log('[Blob] 이미지 업로드 성공');

        // 8. QR 생성에 사용할 URL 반환
        return res.status(200).json({
            url: blob.url
        });

    } catch (e) {

        // 9. 오류 발생 시 Vercel 로그에 기록
        console.error('[Blob upload error]', e);

        return res.status(500).json({
            error: '이미지 저장 실패'
        });
    }
}
