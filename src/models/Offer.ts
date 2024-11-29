export class Offer {
  id: number
  productId: number
  merchantId: string
  price: number

  constructor(data: any) {
    this.id = data.id
    this.productId = data.productId
    this.merchantId = String(data.merchantId)
    this.price = data.price
  }
}
