import { PhysicalAttributes } from "../../domain/entity/PhysicalAttributes";
import { Product } from "../../domain/entity/Product";
import { ProductAndQuantity, ProductRepository } from "../../domain/repository/ProductRepository";
import Connection from "../database/Connection";

export class DBProductRepository implements ProductRepository {
  constructor(readonly connection: Connection) {}

  private async registerProduct(product: Product): Promise<void> {
    const values = `${product.id}, '${product.description}', ${product.physicalAttributes.height_cm}, ${product.physicalAttributes.width_cm}, ${product.physicalAttributes.depth_cm}, ${product.physicalAttributes.weight_kg}, ${product.price}`;

    await this.connection.query(
      `insert into product (id, description, height, width, depth, weight, price) values (${values});`
    );
  }

  async add(product: Product, quantity: number): Promise<boolean> {
    const isValidProduct = await this.isValidProduct(product.id);
    if (!isValidProduct) {
      this.registerProduct(product);
    }
    const [productInStock] = await this.connection.query(`select * from stock where productID = ${product.id};`);
    if (productInStock) {
      const quantityToAdd: number = productInStock.quantity + quantity;
      await this.connection.query(`update stock set quantity = ${quantityToAdd} where productID = ${product.id};`);
    } else {
      await this.connection.query(`insert into stock (productID, quantity) values (${product.id}, ${quantity});`);
    }
    return true;
  }

  async find(productId: number): Promise<ProductAndQuantity | undefined> {
    const [product] = await this.connection.query(`select * from stock where productID = ${productId};`);
    if (!product) {
      this.connection.close();
      return undefined;
    }
    const [item] = await this.connection.query(`select * from product where id = ${product.productID};`);
    if (!item) {
      this.connection.close();
      return undefined;
    }
    let output = {
      product: new Product(
        item.id,
        item.description,
        new PhysicalAttributes(item.height, item.width, item.depth, item.weight),
        item.price
      ),
      quantity: product.quantity,
    };

    return output;
  }

  async isValidProduct(productId: number): Promise<boolean> {
    const [productExist] = await this.connection.query(`select * from product where id = "${productId}";`);
    if (!productExist) {
      return false;
    } else {
      return true;
    }
  }

  async remove(productId: number, quantity: number): Promise<boolean> {
    const [item] = await this.connection.query(`select * from stock where productID = ${productId};`);
    if (!item || item.quantity < quantity) {
      return false;
    }
    await this.connection.query(
      `update stock set quantity = ${item.quantity - quantity} where productID = ${productId};`
    );
    return true;
  }

  async updateQuantityBy(productId: number, amount: number): Promise<boolean> {
    const [productInStock] = await this.connection.query(`select quantity from stock where productID = ${productId}`);

    if (productInStock) {
      const quantityToAdd: number = productInStock.quantity + amount;
      await this.connection.query(`UPDATE stock SET quantity = '${quantityToAdd}' WHERE productID = ${productId}`);
      return true;
    }
    return false;
  }

  async list(): Promise<ProductAndQuantity[]> {
    const products = await this.connection.query("select * from stock");
    let list: ProductAndQuantity[] = [];
    products.forEach(async (product: any): Promise<void> => {
      const [item] = await this.connection.query(`select * from product where id = ${product.productID};`);
      list.push({
        product: new Product(
          item.id,
          item.description,
          new PhysicalAttributes(item.height, item.width, item.depth, item.weight),
          item.price
        ),
        quantity: product.quantity,
      });
    });

    return list;
  }

  async nextId(): Promise<number> {
    const [nextId] = await this.connection.query(`select count(*) as num_items from product`);
    return nextId.num_items + 1;
  }

  async clear(): Promise<void> {
    await this.connection.query(`delete from stock`);
    await this.connection.query(`delete from product`);
  }
}
