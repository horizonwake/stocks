export class CardComponent {
    constructor(title, id, content, footerContent) {
      this.id = id;
      this.content = content;
      this.title = title;
      this.footerContent = footerContent;
    }

    render() {
      const card = document.createElement('div');
      const cardHeader = document.createElement('div');
      const cardBody = document.createElement('div');
      const cardFooter = document.createElement('div');
      cardHeader.className = 'card-header';
      cardBody.className = 'card-body';
      cardFooter.className = 'card-footer';
      card.id = this.id;
      card.className = 'card';
      cardHeader.innerHTML = `<h2>${this.title}</h2>`;
      cardBody.innerHTML = this.content;
      card.append(cardHeader);
      card.append(cardBody);
      if (this.footerContent) {
        cardFooter.innerHTML = this.footerContent;
        card.append(cardFooter);
      }
      return card;
    }
  }
