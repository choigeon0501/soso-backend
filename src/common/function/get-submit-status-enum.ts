import { SubmitType, SubmitStatus } from "../enum/role.enum";
/**
 * SubmitType 과 SubmitStatus 를 조합하여
 * 단일 SubmitCombinedStatus 문자열을 반환한다.
 *
 * 반환 규칙:
 * `${type}_${status}`
 *
 * 가능한 조합 케이스:
 *
 * [최초 제보]
 * - new_shop + pending → new_shop_pending
 * - new_shop + approved → new_shop_approved
 * - new_shop + rejected → new_shop_rejected
 *
 * [운영 정보 수정]
 * - new_operating + pending → new_operating_pending
 * - new_operating + approved → new_operating_approved
 * - new_operating + rejected → new_operating_rejected
 *
 * [판매 정보 수정]
 * - new_product + pending → new_product_pending
 * - new_product + approved → new_product_approved
 * - new_product + rejected → new_product_rejected
 *
 * @param type   제보 유형 (SubmitType)
 * @param status 처리 상태 (SubmitStatus)
 * @returns `${SubmitType}_${SubmitStatus}` 형식의 문자열
 */
export function getSubmitCombinedStatus(
  type: SubmitType,
  status: SubmitStatus,
) { 
  return `${type}_${status}` as const;
}
