export class Product {
  id: number
  productGroupId: number
  name: string

  constructor(data: any) {
    this.id = data.id
    this.productGroupId = data.productGroupId
    this.name = data.name
  }
}
