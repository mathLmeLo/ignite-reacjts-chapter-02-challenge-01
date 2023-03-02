import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => Promise<void>;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => Promise<void>;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    let storagedCart = localStorage.getItem('@RocketShoes:cart');

    let initialCart: Product[] = [];

    if (storagedCart) {
      try {
        initialCart  = JSON.parse(storagedCart);
      } catch {
        console.error('Could not parse localStorage cart data');
      }
    }

    return initialCart;
  });

  const checkStock = async (productId: number, amount: number): Promise<boolean> => {
    const stock: Stock[] = await api.get('stock').then(res => res.data);
    const available: boolean = stock.some(product => product.id === productId && product.amount >= amount)
    if(!available) toast.error('Quantidade solicitada fora de estoque');
    return available;
  }

  const addProduct = async (productId: number) => {
    try {
      const product: Product = await api.get('products/' + productId).then(res => res.data);
      if(!product) throw new Error("Product not found");

      const productInCart = cart.map(item => item.id).indexOf(productId);
      if (productInCart >= 0) {
        if(await checkStock(productId, cart[productInCart].amount + 1)){
          let newCart = cart.map((product) => {
            if (product.id === productId) product.amount += 1;
            return product;
          })
          setCart(newCart);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
        };
      } else {
        if(await checkStock(productId, 1)) {
          const product: Product = await api.get('products/' + productId).then(res => res.data);
          product.amount = 1;
          const newCart = [...cart, product];
          setCart(newCart);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
        }
      }
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = async (productId: number) => {
    try {
      const product: Product = await api.get('products/' + productId).then(res => res.data);
      if(!product) throw new Error("Product not found");
      
      const newCart = cart.filter(product => product.id !== productId);
      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const product: Product = await api.get('products/' + productId).then(res => res.data);
      if(!product) throw new Error("Product not found");

      if (amount <= 0) return;
      if(await checkStock(productId, amount)) {
        const newCart = cart.map(product => {
          if (product.id === productId) product.amount = amount;
          return product;
        });
        setCart(newCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
