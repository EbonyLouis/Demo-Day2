var edit = document.getElementsByClassName("fas fa-pencil-alt");

Array.from(edit).forEach(function(element) {
      element.addEventListener('click', function(){
        const date = this.parentNode.parentNode.childNodes[1].innerText
        const time = this.parentNode.parentNode.childNodes[3].innerText
        const note = this.parentNode.parentNode.childNodes[5].innerText
        fetch('editNotes', {
          method: 'put',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            'dat': date,
            'time': time,
            'note':note
          })
        })
        .then(response => {
          if (response.ok) return response.json()
        })
        .then(data => {
          console.log(data)
          window.location.reload(true)
        })
      });
});
