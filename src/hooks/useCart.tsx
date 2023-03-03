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

  const addProduct = async (productId: number) => {
    try {
      const product: Product = await api.get('products/' + productId).then(res => res.data);
      if(!product) throw new Error("Product not found");

      const newCart = [...cart];

      const productInCart = newCart.find(item => item.id === productId);
      const stock: Stock = await api.get('stock/'+productId).then(res => res.data);

      if (productInCart) {
        if(stock.amount >= productInCart.amount + 1) {
          newCart.forEach((product) => {
            if (product.id === productId) product.amount += 1;
          })
          setCart(newCart);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
        } else {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        };
      } else {
        if(stock.amount >= 1) {
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
      let newCart = [...cart];
      
      const productInCart = newCart.find(prd => prd.id === productId);
      if (productInCart) {
        newCart = newCart.filter(product => product.id !== productId);
        setCart(newCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      } else {
        throw Error();        
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const newCart = [...cart];
      const productInCart = newCart.find(prd => prd.id === productId);

      if (productInCart) {
        const stock: Stock = await api.get('stock/'+productId).then(res => res.data);

        if (amount <= 0) return;
  
        if(stock.amount >= amount) {
          newCart.forEach(product => {
            if (product.id === productId) product.amount = amount;
          });
          setCart(newCart);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
        } else {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }
      } else {
        throw Error();
        
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
