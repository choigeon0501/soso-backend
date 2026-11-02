export enum SubmitType {
  NewShop = 'new_shop',
  NewOperating = 'new_operating',
  NewProduct = 'new_product',
}

export enum SubmitStatus {
  Pending = 'pending',
  Approved = 'approved',
  Rejected = 'rejected',
}

/**
 * 앱은 제보 유형과 처리 상태를 `${type}_${status}` 한 문자열로 받는다(예: new_shop_pending).
 */
export function getSubmitCombinedStatus(type: SubmitType, status: SubmitStatus) {
  return `${type}_${status}` as const;
}
