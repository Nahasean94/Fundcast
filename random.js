const {Observable ,of} =require( 'rxjs')

const { map,tap  } =require( 'rxjs/operators')


  of(10, 100, 1000).pipe(tap(console.log),map(num => Math.log(num) )).subscribe(x => console.log(x))



