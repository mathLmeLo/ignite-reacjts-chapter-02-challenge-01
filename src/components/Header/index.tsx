import React from 'react';
import { Link } from 'react-router-dom';
import { MdShoppingBasket } from 'react-icons/md';

import logo from '../../assets/images/logo.svg';
import { Container, Cart } from './styles';
import { useCart } from '../../hooks/useCart';

interface ProductDict {
  [key: number]: boolean;
}

const Header = (): JSX.Element => {
  const { cart } = useCart();
  const cartSize = cart.reduce((acc, item) => {
    if (!acc.productInCart[`${item.id}`]) {
      acc.productInCart[`${item.id}`] = true;
      acc.totalProducts += 1;
    }

    return acc;
  }, { productInCart: {} as ProductDict, totalProducts: 0}).totalProducts;

  return (
    <Container>
      <Link to="/">
        <img src={logo} alt="Rocketshoes" />
      </Link>

      <Cart to="/cart">
        <div>
          <strong>Meu carrinho</strong>
          <span data-testid="cart-size">
            {cartSize === 1 ? `${cartSize} item` : `${cartSize} itens`}
          </span>
        </div>
        <MdShoppingBasket size={36} color="#FFF" />
      </Cart>
    </Container>
  );
};

export default Header;
